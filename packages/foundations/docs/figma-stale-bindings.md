# Ręczne poprawki w `[Core] UI Library`

**48 wiązań na 27 węzłach**, których Plugin API nie przepnie. Zostały po restrukturyzacji
z 2026-08-10 (tokeny komponentów przeniosły się z `Sizes` do `Components`) — nie po foldzie
kolorów. Renderują ostatnią zapamiętaną wartość, więc **wizualnie nic nie odstaje**; martwa
jest sama referencja, przez co token nie zareaguje na przyszłe zmiany w bibliotece.

Plik: [`[Core] UI Library`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/)

## Dlaczego nie skryptem

**24 wiązania `width`/`height`** siedzą na ikonach-instancjach zagnieżdżonych w instancjach —
id ma postać `I<przycisk>;<wrapper>;<ikona>`, a węzeł o poziom wyżej **sam jest instancją**,
więc standardowe obejście `id.split(';').pop()` ląduje na kolejnej instancji, nie na źródle.
`setBoundVariable` zgłasza sukces i nie zmienia nic.

**6 wiązań `letterSpacing`** ma następcę typu `STRING`, a takiego Figma nie zbinduje do
`letterSpacing` przez Plugin API w żadnym pliku — **ale UI Figmy owszem**, więc ręcznie
przejdzie.

## Jak poprawić jeden węzeł

1. Zaznacz węzeł (linki niżej prowadzą do przodka najwyższego poziomu — w panelu warstw
   zejdź do wskazanej ścieżki).
2. W prawym panelu znajdź właściwość, kliknij ikonę zmiennej.
3. Wybierz token docelowy z tabeli.
4. Dla ikon powtórz dla **`width` i `height`** — to dwa osobne wiązania.

---

## Button — 12 wiązań / 6 węzłów

Wszystkie na `width` + `height`, ikona wewnątrz `Content`.

| węzeł                                                                                                              | wariant                 | zamiast                           | ustaw                                  |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------- | --------------------------------- | -------------------------------------- |
| [`I958:339;811:3550;199:2795`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=958-339) `icon/heart`  | Primary, Size=Large     | `Sizes :: button/large/icon/size` | `Components :: button/large/icon/size` |
| [`I937:1465;811:3550;198:2400`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=937-1465) `icon/cart` | Primary, Size=Default   | `Sizes :: button/icon/size`       | `Components :: button/icon/size`       |
| [`I937:1465;811:5034;198:2376`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=937-1465) `icon/cart` | Secondary, Size=Default | `Sizes :: button/icon/size`       | `Components :: button/icon/size`       |
| [`I937:1465;811:5185;198:2384`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=937-1465) `icon/cart` | Outline, Size=Default   | `Sizes :: button/icon/size`       | `Components :: button/icon/size`       |
| [`I937:1465;811:5336;198:2392`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=937-1465) `icon/cart` | Ghost, Size=Default     | `Sizes :: button/icon/size`       | `Components :: button/icon/size`       |
| [`I937:1465;812:2561;198:2368`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=937-1465) `icon/cart` | Danger, Size=Default    | `Sizes :: button/icon/size`       | `Components :: button/icon/size`       |

## FileInput — 12 wiązań / 6 węzłów

Wszystkie `icon/delete` w przycisku Ghost/Small, na `width` + `height`.
Zamiast `Sizes :: button/small/icon/size` → **`Components :: button/small/icon/size`**.

| węzeł                                                                                           | gdzie             |
| ----------------------------------------------------------------------------------------------- | ----------------- |
| [`I2409:3109;199:2857`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2409-3109) | Actions › Content |
| [`I2409:3140;199:2857`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2409-3140) | Actions › Content |
| [`I2409:3179;199:2857`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2409-3179) | Item › Content    |
| [`I2409:3186;199:2857`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2409-3186) | Item › Content    |
| [`I2409:3210;199:2857`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2409-3210) | Item › Content    |
| [`I2409:3217;199:2857`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2409-3217) | Item › Content    |

## Input — 10 wiązań / 5 węzłów

Wszystkie `Right Icon` w polu Outline/Default, na `width` + `height`.
Zamiast `Sizes :: icon/sm` → **`Sizes :: icon/sm`** — ta sama nazwa, ale plik trzyma
nieświeżą kopię; wybranie tokenu na nowo z panelu podepnie żywą zmienną.

| węzeł                                                                                                   | wariant pola                    |
| ------------------------------------------------------------------------------------------------------- | ------------------------------- |
| [`I229:3421;99:3005`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=229-3421)            | Value=Empty, Show password=Off  |
| [`I229:3493;158:459`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=229-3493)            | Value=Filled, Show password=Off |
| [`I229:3623;158:459`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=229-3623)            | Value=Filled, Show password=On  |
| [`I242:1090;158:459`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=242-1090)            | Value=Filled                    |
| [`I1894:2750;229:3421;99:3005`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1894-2750) | Value=Empty, Show password=Off  |

## Checkbox — 6 wiązań / 6 węzłów

Etykieta `accept terms and conditions`, właściwość **`letterSpacing`** (jedno wiązanie na węzeł).
Zamiast `Sizes :: checkbox/field/letter-spacing` → **`Components :: checkbox/field/letter-spacing`**.

| węzeł                                                                                                     | stan                  |
| --------------------------------------------------------------------------------------------------------- | --------------------- |
| [`1145:1156`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1145-1156)                     | State=Default         |
| [`1145:1153`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1145-1153)                     | State=Hover           |
| [`1145:1150`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1145-1150)                     | State=Focus           |
| [`1145:1147`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1145-1147)                     | State=Error           |
| [`1145:1144`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1145-1144)                     | State=Disabled        |
| [`I1145:1157;811:3550;1145:1156`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=1145-1157) | instancja w `Frame 2` |

> Pięć pierwszych to zwykłe węzły TEXT — po ich poprawieniu szósty (instancja) powinien
> podążyć sam. Sprawdź go na końcu, nie na początku.

## Chip — 4 wiązania / 2 węzły

`LeadingIcon`, `width` + `height`.
Zamiast `Sizes :: chip/medium/icon/size` → **`Components :: chip/medium/icon/size`**.

| węzeł                                                                                            | wariant                  |
| ------------------------------------------------------------------------------------------------ | ------------------------ |
| [`I2127:3492;2068:2153`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2127-3492) | Warning, Outline, Medium |
| [`I2127:3495;2068:2477`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2127-3495) | Error, Outline, Medium   |

## Calendar — 4 wiązania / 2 węzły

Chevrony w nagłówku, przycisk Ghost/Small, `width` + `height`.
Zamiast `Sizes :: button/small/icon/size` → **`Components :: button/small/icon/size`**.

| węzeł                                                                                       | ikona                |
| ------------------------------------------------------------------------------------------- | -------------------- |
| [`I2107:48;199:2857`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2107-48) | `icon/chevron-left`  |
| [`I2107:55;199:2857`](https://www.figma.com/design/BzqkruN7r8mwWfFReznc83/?node-id=2107-55) | `icon/chevron-right` |

---

## Weryfikacja

Nie ufaj temu, że coś wygląda dobrze — martwe wiązanie renderuje poprawną wartość.
Po przejściu listy uruchom skan, który porównuje `key` każdego wiązania z opublikowaną
biblioteką (ten sam, który tę listę wyprodukował):

```js
// use_figma na danej stronie
const libColls = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
const pk = {};
for (const c of libColls.filter((c) => c.libraryName === '[Core] Foundations')) {
  const vars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(c.key);
  pk[c.name] = new Set(vars.map((v) => v.key));
}
// …dla każdego bindowania: jeśli pk[kolekcja] nie zawiera zmiennej.key → wciąż osierocone
```

Docelowo wszystkie sześć stron ma zwrócić **zero**.
