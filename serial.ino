#include <OctoWS2811.h>

const int nStrips = 6;
const int ledsPerStrip = 180;

DMAMEM int displayMemory[ledsPerStrip*nStrips];
byte databuffer[ledsPerStrip*nStrips*3];

const int config = WS2811_GRB | WS2811_800kHz; 

OctoWS2811 leds(ledsPerStrip, displayMemory, NULL, config);

void setup() {
//  Serial.begin(9600);
  Serial.setTimeout(100);
  leds.begin();
  leds.show();
}

void loop() {
//
// wait for a Start-Of-Message character:
//
//   '*' = begin column

  int startChar = Serial.read();

  if (startChar == '*') {

    // int count = Serial.readBytes((char *)databuffer, sizeof(databuffer));
    //if (count == sizeof(databuffer)) {
      // WS2811 update begins immediately after falling edge of frame sync
      for (int x = 0; x < nStrips * ledsPerStrip; x++){
        int x3 = x *3;
        leds.setPixel(x, (databuffer[x3] << 16) | (databuffer[x3 + 1] << 8) | (databuffer[x3 +2]));
      }
      leds.show();
     
    //}
  } else if (startChar >= 0) {
    // discard unknown characters
  }
}

