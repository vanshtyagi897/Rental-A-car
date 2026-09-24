import balenoImg from '../assets/cars/Baleno.jpg';
import boleroImg from '../assets/cars/bolero.jpg';
import brezzaImg from '../assets/cars/Brezza.jpg';
import cretaImg from '../assets/cars/creta.jpg';
import fronxImg from '../assets/cars/fronx.jpg';
import scorpioNImg from '../assets/cars/Scorpio_n.jpg';
import scorpioS11Img from '../assets/cars/scorpio_s11.jpg';
import swiftDzireImg from '../assets/cars/SwiftDzire.jpg';
import tharImg from '../assets/cars/thar.jpg';
import vernaImg from '../assets/cars/verna.jpg';

export const CAR_IMAGE_MAP = {
  'baleno': balenoImg,
  'bolero': boleroImg,
  'brezza': brezzaImg,
  'creta': cretaImg,
  'fronx': fronxImg,
  'scorpio n': scorpioNImg,
  'scorpio_n': scorpioNImg,
  'scorpio-n': scorpioNImg,
  'scorpio s11': scorpioS11Img,
  'scorpio_s11': scorpioS11Img,
  'scorpio-s11': scorpioS11Img,
  'swift dzire': swiftDzireImg,
  'swiftdzire': swiftDzireImg,
  'swift': swiftDzireImg,
  'thar': tharImg,
  'verna': vernaImg
};

export function getCarImage(carName, customImageUrl) {
  if (customImageUrl && customImageUrl.trim() !== '#' && customImageUrl.trim() !== '') {
    // If custom image url is provided and not a placeholder, use it
    return customImageUrl;
  }

  if (carName) {
    const key = carName.toLowerCase().trim();
    if (CAR_IMAGE_MAP[key]) {
      return CAR_IMAGE_MAP[key];
    }
    // Partial search
    for (const [k, src] of Object.entries(CAR_IMAGE_MAP)) {
      if (key.includes(k) || k.includes(key)) {
        return src;
      }
    }
  }

  return customImageUrl || '#';
}
