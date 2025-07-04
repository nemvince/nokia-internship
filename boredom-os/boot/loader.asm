; Simple x86 bootloader that loads ELF kernel and switches to protected mode
; Assemble with: nasm -f bin bootloader.asm -o bootloader.bin

[BITS 16]
[ORG 0x7C00]

start:
    ; Set up segments
    cli
    xor ax, ax
    mov ds, ax
    mov es, ax
    mov ss, ax
    mov sp, 0x7C00
    sti
    
    ; Print loading message
    mov si, loading_msg
    call print_string
    
    ; Load kernel from disk
    call load_kernel
    
    ; Check if kernel is valid ELF
    call validate_elf
    
    ; Set up protected mode
    call setup_protected_mode
    
    ; Should never reach here
    jmp $

; Print string function (SI = string pointer)
print_string:
    lodsb
    test al, al
    jz .done
    mov ah, 0x0E
    int 0x10
    jmp print_string
.done:
    ret

; Load kernel from disk sectors following bootloader
load_kernel:
    mov ax, 0x0100          ; Load to 0x1000 (ES:BX = 0x0100:0x0000)
    mov es, ax
    xor bx, bx
    
    mov ah, 0x02            ; Read sectors
    mov al, 32              ; Read 32 sectors (16KB) - enough for small kernel
    mov ch, 0               ; Cylinder 0
    mov cl, 2               ; Start from sector 2 (after bootloader)
    mov dh, 0               ; Head 0
    mov dl, 0x80            ; Drive 0 (first hard disk)
    
    int 0x13
    jc disk_error
    
    mov si, kernel_loaded_msg
    call print_string
    ret

disk_error:
    mov si, disk_error_msg
    call print_string
    jmp $

; Validate ELF header
validate_elf:
    mov ax, 0x0100
    mov es, ax
    
    ; Check ELF magic number (0x7F, 'E', 'L', 'F')
    cmp byte [es:0], 0x7F
    jne invalid_elf
    cmp byte [es:1], 'E'
    jne invalid_elf
    cmp byte [es:2], 'L'
    jne invalid_elf
    cmp byte [es:3], 'F'
    jne invalid_elf
    
    mov si, elf_valid_msg
    call print_string
    ret

invalid_elf:
    mov si, invalid_elf_msg
    call print_string
    jmp $

; Set up protected mode
setup_protected_mode:
    cli
    
    ; Load GDT
    lgdt [gdt_descriptor]
    
    ; Enable A20 line
    call enable_a20
    
    ; Set protected mode bit
    mov eax, cr0
    or eax, 1
    mov cr0, eax
    
    ; Jump to protected mode code
    jmp 0x08:protected_mode_start

enable_a20:
    ; Fast A20 enable method
    in al, 0x92
    or al, 2
    out 0x92, al
    ret

[BITS 32]
protected_mode_start:
    ; Set up protected mode segments
    mov ax, 0x10            ; Data segment selector
    mov ds, ax
    mov es, ax
    mov fs, ax
    mov gs, ax
    mov ss, ax
    mov esp, 0x7C00         ; Set up stack
    
    ; Parse ELF and jump to entry point
    call parse_elf_and_jump
    
    ; Should never reach here
    jmp $

parse_elf_and_jump:
    ; ELF header is at 0x1000
    mov ebx, 0x1000
    
    ; Get entry point from ELF header (offset 0x18)
    mov eax, [ebx + 0x18]
    
    ; Get program header table offset (offset 0x1C)
    mov esi, [ebx + 0x1C]
    add esi, ebx            ; ESI = program header table address
    
    ; Get number of program headers (offset 0x2C)
    movzx ecx, word [ebx + 0x2C]
    
    ; Get program header entry size (offset 0x2A)
    movzx edx, word [ebx + 0x2A]
    
.load_segments:
    ; Check if this is a loadable segment (PT_LOAD = 1)
    cmp dword [esi], 1
    jne .next_header
    
    ; Get file offset, virtual address, and size
    mov eax, [esi + 4]      ; File offset
    add eax, ebx            ; Source address
    mov edi, [esi + 8]      ; Virtual address (destination)
    mov ecx, [esi + 16]     ; File size
    
    ; Copy segment to its virtual address
    rep movsb
    
.next_header:
    add esi, edx            ; Next program header
    loop .load_segments
    
    ; Jump to kernel entry point
    mov eax, [ebx + 0x18]   ; Entry point
    jmp eax

; GDT (Global Descriptor Table)
gdt_start:
    ; Null descriptor
    dd 0x0
    dd 0x0
    
    ; Code segment descriptor
    dw 0xFFFF               ; Limit low
    dw 0x0000               ; Base low
    db 0x00                 ; Base middle
    db 10011010b            ; Access byte (code, readable, ring 0)
    db 11001111b            ; Flags and limit high
    db 0x00                 ; Base high
    
    ; Data segment descriptor
    dw 0xFFFF               ; Limit low
    dw 0x0000               ; Base low
    db 0x00                 ; Base middle
    db 10010010b            ; Access byte (data, writable, ring 0)
    db 11001111b            ; Flags and limit high
    db 0x00                 ; Base high
gdt_end:

gdt_descriptor:
    dw gdt_end - gdt_start - 1  ; Size
    dd gdt_start                ; Address

; Messages
loading_msg db 'Loading kernel...', 0xD, 0xA, 0
kernel_loaded_msg db 'Kernel loaded successfully!', 0xD, 0xA, 0
disk_error_msg db 'Disk read error!', 0xD, 0xA, 0
elf_valid_msg db 'ELF header valid!', 0xD, 0xA, 0
invalid_elf_msg db 'Invalid ELF header!', 0xD, 0xA, 0

; Pad to 510 bytes and add boot signature
times 510-($-$$) db 0
dw 0xAA55
