#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* DEFECT 1: NULL pointer dereference */
void nullPointerDefect() {
    int *p = NULL;
    *p = 5;  /* Coverity: FORWARD_NULL */
}

/* DEFECT 2: Memory leak */
void memoryLeakDefect() {
    int *arr = (int*)malloc(100 * sizeof(int));
    arr[0] = 1;
    /* Coverity: RESOURCE_LEAK - forgot free(arr) */
}

/* DEFECT 3: Buffer overrun */
void bufferOverrunDefect() {
    int arr[5];
    int i;
    for (i = 0; i <= 5; i++) {
        arr[i] = i;  /* Coverity: OVERRUN - arr[5] out of bounds */
    }
}

/* DEFECT 4: Use after free */
void useAfterFreeDefect() {
    int *p = (int*)malloc(sizeof(int));
    *p = 10;
    free(p);
    *p = 20;  /* Coverity: USE_AFTER_FREE */
}

/* DEFECT 5: Uninitialized variable */
void uninitializedVarDefect() {
    int x;
    int y = x + 1;  /* Coverity: UNINIT */
    printf("%d\n", y);
}

int main() {
    memoryLeakDefect();
    bufferOverrunDefect();
    return 0;
}
