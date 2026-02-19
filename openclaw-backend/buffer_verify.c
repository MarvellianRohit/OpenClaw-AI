
#include <stdio.h>

void vulnerable_function() {
    char buffer[10];
    printf("Enter sensitive data: ");
    fgets(buffer, sizeof(buffer), stdin); // Buffer overflow vulnerability
    printf("You entered: %s\n", buffer);
}

int main() {
    vulnerable_function();
    return 0;
}
