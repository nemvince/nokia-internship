/*
    Welcome to my wonderful program file
    written in the C language

    This is very awesome
*/
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

void mirrorNumbers()
{
    int a = 0;
    int b = 0;

    while (++a < 10)
    {
        b = 0;
        while (b < 10)
        {
            printf("%i%i%i\n", a, b++, a);
        }
    }
}

int getInteger()
{
    int tmp;

    printf("Please enter a value for our funny integer: ");
    scanf("%d", &tmp);

    printf("Our funny integer has been set to %d, at address 0x%x\n", tmp, &tmp);

    return tmp;
}

void triangle()
{
    int n = getInteger();

    for (int i = 1; i <= n; i++)
    {

        for (int j = 1; j <= n - i; j++)
        {
            printf(" ");
        }

        for (int k = 1; k <= 2 * i - 1; k++)
        {
            printf("o");
        }
        printf("\n");
    }
}

void rightTriangle()
{
    int n = getInteger();
    for (int i = 0; i < n - 1; i++)
    {
        for (int j = 0; j < n - i - 2; j++)
        {
            printf(" ");
        }

        printf("/");
        for (int k = 0; k < i; k++)
        {
            printf(" ");
        }
        printf("|\n");
    }

    for (int i = 0; i < n - 1; i++)
    {
        printf("-");
    }

    printf("+\n");
}

void getDivisibility()
{
    int a = getInteger();
    int b = getInteger();

    int aByB = a % b;
    int bByA = b % a;

    if (aByB == 0 && bByA == 0)
    {
        printf("Mint a ket szam oszthato egymassal");
    }
    else if (aByB == 0)
    {
        printf("A %d oszthato %d-al", a, b);
    }
    else if (bByA == 0)
    {
        printf("A %d oszthato %d-al", b, a);
    }
    else
    {
        printf("Egyik szam sem oszthato a masikkal");
    }
}

void prettyPrintArray()
{
    int array[5] = {1, 2, 3, 4, 5};
    int i = 0;

    while (i < (sizeof(array) / sizeof(array[0])))
    {
        printf("%s%d", i ? ", " : "", array[i]);
        i++;
    }
    printf("\n");
}

void steepness()
{

    double depths[] = {0.1, 1, 1.5, 1.7, 2, 2.3, 2.8, 4.5, 9.8, 12, 14.1, 13, 11.9, 8.7, 6.1, 3.5, 1, 0.5};
    int n = sizeof(depths) / sizeof(depths[0]);
    double max_slope = 0;
    int max_slope_index = 0;

    for (int i = 1; i < n; i++)
    {
        double slope = fabs((depths[i] - depths[i - 1]) / 2) * 100;
        if (slope > max_slope)
        {
            max_slope = slope;
            max_slope_index = i;
        }
    }

    printf("the steepest part of the riverbed is between measurements %d and %d.\n", max_slope_index - 1, max_slope_index);
    printf("The percentage slope is %.2f%%.\n", max_slope);
}

void leftRotateArray()
{
    int v[10] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9};
    int n = 10;
    int k = 3;

    printf("original arr:\n");
    for (int i = 0; i < n; i++)
    {
        printf("%d ", v[i]);
    }
    printf("\n");

    for (int i = 0; i < k; i++)
    {
        int temp = v[0];
        for (int j = 0; j < n - 1; j++)
        {
            v[j] = v[j + 1];
        }
        v[n - 1] = temp;
    }

    printf("3 left rotates later:\n");
    for (int i = 0; i < n; i++)
    {
        printf("%d ", v[i]);
    }
    printf("\n");
}

void pointsInCirlce()
{
    int x_center, y_center, radius;
    printf("center x coord: ");
    scanf("%d", &x_center);
    printf("\ncenter y coord: ");
    scanf("%d", &y_center);
    printf("\nradius: ");
    scanf("%d", &radius);

    int count = 0;

    for (int x = x_center - radius; x <= x_center + radius; x++)
    {
        for (int y = y_center - radius; y <= y_center + radius; y++)
        {
            if ((x - x_center) * (x - x_center) + (y - y_center) * (y - y_center) <= radius * radius)
            {
                count++;
            }
        }
    }

    printf("\nint points inside circle: %d\n", count);
}

double estimatePi(int n)
{
    double result = 1.0;
    int x = 2;
    int y = 1;
    for (int i = 0; i < n; i++)
    {
        result *= (double)(x * x) / (y * (y + 2));
        x += 2;
        y += 2;
    }

    return result * 2;
}

void runEstimatePi()
{
    printf("10 it\t%f\n", estimatePi(10));
    printf("100 it\t%f\n", estimatePi(100));
    printf("1000 it\t%f\n", estimatePi(1000));
    printf("10000it\t%f\n", estimatePi(10000));
}

typedef struct
{
    double length;
    double width;
    double height;
    double volume;
    double surface_area;
} RectPrism;

double calculate_volume(double length, double width, double height)
{
    return length * width * height;
}

double calculate_surface_area(double length, double width, double height)
{
    return 2 * (length * width + width * height + height * length);
}

RectPrism *find_max_volume(RectPrism *prisms, int count)
{
    if (count == 0)
        return NULL;
    RectPrism *max_volume_prism = &prisms[0];
    for (int i = 1; i < count; i++)
    {
        if (prisms[i].volume > max_volume_prism->volume)
        {
            max_volume_prism = &prisms[i];
        }
    }
    return max_volume_prism;
}

RectPrism *find_min_surface_area(RectPrism *prisms, int count)
{
    if (count == 0)
        return NULL;
    RectPrism *min_surface_area_prism = &prisms[0];
    for (int i = 1; i < count; i++)
    {
        if (prisms[i].surface_area < min_surface_area_prism->surface_area)
        {
            min_surface_area_prism = &prisms[i];
        }
    }
    return min_surface_area_prism;
}

int main()
{
    int n;
    printf("Enter the number of rectangular prisms: ");
    scanf("%d", &n);

    RectPrism *prisms = (RectPrism *)malloc(n * sizeof(RectPrism));
    if (prisms == NULL)
    {
        printf("Memory allocation failed\n");
        return 1;
    }

    for (int i = 0; i < n; i++)
    {
        printf("Enter the length, width, and height of rectangular prism %d: ", i + 1);
        scanf("%lf %lf %lf", &prisms[i].length, &prisms[i].width, &prisms[i].height);
        prisms[i].volume = calculate_volume(prisms[i].length, prisms[i].width, prisms[i].height);
        prisms[i].surface_area = calculate_surface_area(prisms[i].length, prisms[i].width, prisms[i].height);
    }

    RectPrism *max_volume_prism = find_max_volume(prisms, n);
    if (max_volume_prism != NULL)
    {
        printf("Rectangular prism with the most volume has dimensions %.2lf x %.2lf x %.2lf, volume %.2lf\n",
               max_volume_prism->length, max_volume_prism->width, max_volume_prism->height, max_volume_prism->volume);
    }

    RectPrism *min_surface_area_prism = find_min_surface_area(prisms, n);
    if (min_surface_area_prism != NULL)
    {
        printf("Rectangular prism with the least surface area has dimensions %.2lf x %.2lf x %.2lf, surface area %.2lf\n",
               min_surface_area_prism->length, min_surface_area_prism->width, min_surface_area_prism->height, min_surface_area_prism->surface_area);
    }

    free(prisms);

    return 0;
}
