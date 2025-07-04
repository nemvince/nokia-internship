ENTRY(_start)
OUTPUT_FORMAT(elf64-x86-64)

SECTIONS
{
    /* Load kernel at 0x1000 */
    . = 0x1000;
    
    /* Text section (code) */
    .text : {
        *(.text)
    }
    
    /* Read-only data */
    .rodata : {
        *(.rodata)
    }
    
    /* Initialized data */
    .data : {
        *(.data)
    }
    
    /* Uninitialized data */
    .bss : {
        *(.bss)
    }
}
