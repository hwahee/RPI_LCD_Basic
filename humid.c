#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <wiringPi.h>

#define MAX_TIME 100
#define DHT11PIN 25

int dht11_val[5] = { 0, 0, 0, 0, 0 };

int dht11_read_val()
{
    uint8_t lststate = HIGH;
    uint8_t counter = 0;
    uint8_t j = 0;
    for (int i = 0; i < 5; i++)
        dht11_val[i] = 0;
    pinMode(DHT11PIN, OUTPUT);
    digitalWrite(DHT11PIN, 0);
    delay(18);
    digitalWrite(DHT11PIN, 1);
    delayMicroseconds(40);
    pinMode(DHT11PIN, INPUT);

    int i;
    for (i = 0; i < MAX_TIME; i++) {
        counter = 0;
        while (digitalRead(DHT11PIN) == lststate) {
            counter++;
            delayMicroseconds(1);
            if (counter == 255)
                break;
        }
        lststate = digitalRead(DHT11PIN);
        if (counter == 255)
            break;
        if ((4 <= i) && (i % 2 == 0)) {
            dht11_val[j / 8] <<= 1;
            if (26 < counter)
                dht11_val[j / 8] |= 1;
            j++;
        }
    }

    if ((40 <= j) && (dht11_val[4] == (dht11_val[0] + dht11_val[1] + dht11_val[2] + dht11_val[3]))) {
        printf("%d %d.%d", dht11_val[0], dht11_val[2], dht11_val[3]);
        return 0;
    } else {
        //printf("%d %d %d %d %d %d\n", j, dht11_val[0], dht11_val[1], dht11_val[2], dht11_val[3], dht11_val[4]);
        return 1;
    }
}

int main()
{
    if (wiringPiSetup() == -1) {
        exit(1);
    }
    int trial=50;
    while (0 < trial--) {
        if (!dht11_read_val())
            return 0;
        delay(500);
    }

    printf("0,0 0.0");
    return 0;    
}
