export const BASE_URL = "https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app";

export const PROJECT_PREFIX: Record<string, string> = {
  "VAROTRA": "V",
  "FAMBOLENA": "F",
  "ASA TANANA": "AT",
  "FIOMPIANA KISOA": "FK",
  "FIOMPIANA AKOHO": "FA",
  "FIOMPIANA GANA": "FG1",
  "FIOMPIANA GISA": "FG2",
  "FIOMPIANA HAFA": "FH",
  "RESPONSABLE AMM": "RH"
};

export interface Question {
  id: number;
  text: string;
  weight: number;
}

export const QUESTIONS_LIST: Question[] = [
  { id: 1, text: "Misy olona mihoatra ny 5 ve ao an-tokantrano?", weight: 10 },
  { id: 2, text: "Misy fidiram-bola raikitra ve ny loham-pianakaviana?", weight: 10 },
  { id: 3, text: "Efa nanao ity karaza-tetikasa ity ve teo aloha?", weight: 10 },
  { id: 4, text: "Manana tany malalaka azo ampiasaina ve ny fianakaviana?", weight: 10 },
  { id: 5, text: "Mety amin'ny tetikasa voafidy ve ny toetrandro eo an-toerana?", weight: 10 },
  { id: 6, text: "Trano vato na biriky ve ilay logement?", weight: 10 },
  { id: 7, text: "Manana jiro (Jirama na Solar) ve ao an-trano?", weight: 10 },
  { id: 8, text: "Misy rano madio (paompy na fantsakana) ve eo amin'ny tanàna?", weight: 10 },
  { id: 9, text: "Manana fitaovam-pifandraisana (Finday/Radio) ve ny ao an-trano?", weight: 10 },
  { id: 10, text: "Mora idiran'ny fiara na kalesy ver ny lalana mankany amin'ny trano?", weight: 10 },
  { id: 11, text: "Efa nahazo fiofanana momba ity tetikasa ity ve ilay mpikambana?", weight: 10 },
  { id: 12, text: "Manana fitaovana fototra ilaina amin'ny tetikasa ve izy?", weight: 10 },
  { id: 13, text: "Afaka manome antoka amin'ny faharetan'ny tetikasa ve izy?", weight: 10 },
  { id: 14, text: "Misy olona afaka manampy azy ve ao an-tokantrano?", weight: 10 },
  { id: 15, text: "Mino ny fisian'ny fanohanana ve izy?", weight: 10 },
  { id: 16, text: "Vonona hanokan-tena fotoana feno amin'ny asa avy hatrany ve izy?", weight: 10 },
  { id: 17, text: "Manaiky ny fanaraha-maso ataon'ny Association ve izy?", weight: 10 },
  { id: 18, text: "Efa mpikambana mavitrika ao anatin'ny AMM ve izy?", weight: 10 },
  { id: 19, text: "Nisy fotoana ve tsy maintsy nindram-bola hividianana sakafo?", weight: -20 },
  { id: 20, text: "Manana tahiry ampy ho an'ny fanafody ve ianao?", weight: 20 }
];

export const base64Logo = "iVBORw0KGgoAAAANSUhEUgAACToAAAuJCAYAAAAEr0GMAAAgAElEQVR4nOzBAQEAAACCoP6vbojAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAdD0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC6wjDNDNDakhVLVAkAAOgYRbUYn2RskilJxjXfb/iK92keL8d/JicZkWRSkpFJJiQZvdL5pTFJxq90j1NWGGradeV20nHeeVvS+7IuuM8S4FqA7vH/XQvS8P9yWbZ98V0T9G0tYxP1OceGtcXG0fMvVtcR9y6aWpdUo5TbeF9Xay9pY8v3YdpN389V8VId598Xq3L/6Tq9ZfPrYV/6y9ZHeA9OOfqQpB3sGH6O/reZq5N3Oq6fPef3eE/qGgWOfC3H90r89uH3cEreTjI+mQOclC07D6D8XNqA0vHIsW0/8nIafbOPfInyX+UfW3dUn7h+B3Z92KxXWv6S5UuzYlIibqf9fHovX+H2m/XetBqWfshI0KOmXQySkI2E8iX3O/2fVMyoNbyZkCH9M7nLpxN2R7nIsWeNfDpsSyyO2bZesWsh32qK3j2OnlUn3tNodMupOuywnr3K+Wfsc+x6mDlrp38C7w+BvT1eIulh4S+iZqLsh9T/Nl7M7O6P7rRtvpUun5uV6P8NqYhX9y8N+Gv7PjS6fV9/v4vV4tSdtl4unH/vM6zY67Nl8A31vD4m77WkLCHUG7m7GZclW3+Sg2X6Z4+043n0Ofi6A7/Nrt8j9/P3fXF9fPOnYgHjYJgC0X6f3oInRzYve6vYp/Dteq6W761oZ+H/3mXqI/69XvXQ85XW7v2O6u/be/X3fF1ApeW691zXvbeT8sAnGscA6Z6mHh68bU/x7W/N7U9N+v+zG2vI9L8xHYiVf8W3wVydXoZ4g6vE0XUuUuHuxIqVfF68j+JpKeTPrw9pX0xNis8/B4i0XG0/l3K6iVvS4Wb0vU/v+OOfVfFzzdOPB1v98KhpZEn6rKmrnPM57U6/Wna0XWh2O/aP++bQ6p/T3bS6/YpSvvBof7vO2bS/uDo1qB2u/1T/x/D55C8h7bXQW376T/vY483Z7gO7v1ZCH392fVpEisbHhPjX0qU0fX/AdFvOfg=";


