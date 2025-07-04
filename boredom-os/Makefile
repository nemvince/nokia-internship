# Makefile for building the bootloader and kernel

# Compiler and assembler settings
ASM = nasm
CC = gcc
LD = ld
CFLAGS = -ffreestanding -O2 -Wall -Wextra -fno-pie -fno-pic -nostdlib -nostdinc
LDFLAGS = -m elf_x86_64 -T kernel/linker.ld

# Target files
BOOTLOADER = boot/loader.bin
KERNEL_OBJ = kernel/kernel.o
KERNEL_ELF = kernel/kernel.elf
OS_IMAGE = os-img

# Default target
all: clean $(OS_IMAGE)

# Build bootloader
$(BOOTLOADER): boot/loader.asm
	$(ASM) -f bin $< -o $@

# Build kernel object
$(KERNEL_OBJ): kernel/kernel.c
	$(CC) $(CFLAGS) -c $< -o $@

# Link kernel ELF
$(KERNEL_ELF): $(KERNEL_OBJ)
	$(LD) $(LDFLAGS) $< -o $@

# Create OS image by combining bootloader and kernel
$(OS_IMAGE): $(BOOTLOADER) $(KERNEL_ELF)
	dd if=/dev/zero of=$@ bs=1024 count=1440
	dd if=$(BOOTLOADER) of=$@ bs=512 count=1 conv=notrunc
	dd if=$(KERNEL_ELF) of=$@ bs=512 seek=1 conv=notrunc
	qemu-system-x86_64 -drive file=os-img,format=raw -net none


# Run in QEMU
run: $(OS_IMAGE)
	qemu-system-x86_64 -fda $(OS_IMAGE)

# Debug with QEMU
debug: $(OS_IMAGE)
	qemu-system-x86_64 -fda $(OS_IMAGE) -s -S

# Clean build artifacts
clean:
	rm -f $(BOOTLOADER) $(KERNEL_OBJ) $(KERNEL_ELF) $(OS_IMAGE)

# Check if tools are available
check-tools:
	@which $(ASM) > /dev/null || (echo "NASM not found. Install with: sudo apt-get install nasm" && exit 1)
	@which $(CC) > /dev/null || (echo "GCC not found. Install with: sudo apt-get install gcc" && exit 1)
	@which $(LD) > /dev/null || (echo "LD not found. Install with: sudo apt-get install binutils" && exit 1)
	@which qemu-system-x86_64 > /dev/null || (echo "QEMU not found. Install with: sudo apt-get install qemu-system-x86" && exit 1)
	@echo "All required tools are available!"

# Show help
help:
	@echo "Available targets:"
	@echo "  all         - Build the complete OS image"
	@echo "  run         - Build and run the OS in QEMU"
	@echo "  debug       - Build and run the OS in QEMU with debugging"
	@echo "  clean       - Remove all build artifacts"
	@echo "  check-tools - Check if required tools are installed"
	@echo "  help        - Show this help message"

.PHONY: all run debug clean check-tools help
