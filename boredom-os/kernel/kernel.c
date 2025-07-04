// Forward declaration
void kernel_main(void);

// Entry point that the bootloader will call
void _start(void) {
    kernel_main();
}

// VGA text mode constants
#define VGA_MEMORY 0xB8000
#define VGA_WIDTH 80
#define VGA_HEIGHT 25
#define VGA_COLOR_BLACK 0
#define VGA_COLOR_GREEN 2

// Create VGA color attribute
#define VGA_COLOR(fg, bg) ((bg << 4) | fg)

// VGA buffer pointer
volatile char* vga_buffer = (char*)VGA_MEMORY;

// Current cursor position
static int terminal_row = 0;
static int terminal_column = 0;
static int terminal_color = VGA_COLOR(VGA_COLOR_GREEN, VGA_COLOR_BLACK);

// Clear the screen
void terminal_clear(void) {
    for (int y = 0; y < VGA_HEIGHT; y++) {
        for (int x = 0; x < VGA_WIDTH; x++) {
            const int index = y * VGA_WIDTH + x;
            vga_buffer[index] = ((int)terminal_color << 8) | ' ';
        }
    }
    terminal_row = 0;
    terminal_column = 0;
}

// Kernel entry point
void kernel_main(void) {
    // Clear the screen
    terminal_clear();
}
