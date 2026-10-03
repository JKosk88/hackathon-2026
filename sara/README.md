# Rekomendacje wydarzeń — SARA

Moduł Python rekomendujący wydarzenia na podstawie oglądania ich stron,
głębokości przewijania, powrotów i zapisów. Nie wymaga ankiety użytkownika.
Zainteresowania są wyznaczane z **tagów wydarzeń**, z którymi użytkownik miał kontakt.

## 1. Stan implementacji

- Działa lokalna funkcja przyjmująca ID użytkownika i zwracająca uporządkowane ID wydarzeń.
- Dane demonstracyjne: 12 użytkowników, 38 wydarzeń i 53 interakcje.
- Użytkownicy demonstracyjni nie mają ręcznie wpisanych zainteresowań.
- **Nie ma jeszcze endpointu HTTP, połączenia z bazą ani zbierania scrolla na frontendzie.**
- Funkcja demonstracyjna używa stałej daty `AS_OF`: 3 października 2026, 12:00 UTC.
  Nie jest to aktualny zegar produkcyjny.

## 2. Pliki

| Plik                                       | Odpowiedzialność                                         |
| ------------------------------------------ | -------------------------------------------------------- |
| [recommendations.py](recommendations.py)   | Proste wejście: ID użytkownika → lista ID wydarzeń       |
| [recommender.py](recommender.py)           | Modele danych, agregacja historii, filtrowanie i ranking |
| [mock_data.py](mock_data.py)               | Przykładowi użytkownicy, wydarzenia i interakcje         |
| [sara.ipynb](sara.ipynb)                   | Interaktywne przykłady i podgląd wyników                 |
| [test_recommender.py](test_recommender.py) | Testy zasad rekomendacji                                 |

## 3. Funkcja dla frontendu

Import działa z katalogu `sara` lub po dodaniu tego katalogu do ścieżki modułów:

```python
from recommendations import get_recommended_event_ids

event_ids = get_recommended_event_ids("eve")
event_ids = get_recommended_event_ids("eve", limit=3)
```

Sygnatura: `get_recommended_event_ids(user_id: str, limit: int = 12) -> list[str]`.

- `user_id` to identyfikator, nie nazwa użytkownika. Musi istnieć w danych.
- Domyślnie zwracane jest **maksymalnie 12** wydarzeń.
- Pierwsze ID oznacza najwyższy wynik rekomendacji. Frontend powinien zachować tę kolejność.
- Jeśli pasujących wydarzeń jest mniej, lista jest krótsza. Może też być pusta.
- `limit=0` zwraca pustą listę dla znanego użytkownika.
- Nieznany użytkownik lub nieprawidłowy limit powoduje `ValueError`.
- Funkcja buduje model z mock danych przy każdym wywołaniu; nie aktualizuje bazy.

## 4. Dane wejściowe

### Użytkownik: `User`

| Pole        | Typ               | Znaczenie                                                           |
| ----------- | ----------------- | ------------------------------------------------------------------- |
| `id`        | `str`             | Unikalne ID, zgodne z ID w interakcjach                             |
| `name`      | `str`             | Nazwa do wyświetlania                                               |
| `interests` | `tuple[str, ...]` | Opcjonalne, domyślnie puste; niewykorzystywane w mock użytkownikach |

Pole `interests` pozostało jako opcjonalna możliwość modelu. **Nie trzeba go zbierać**:
profil działa na samej historii interakcji i tagach wydarzeń.

### Wydarzenie: `Event`

| Pole        | Typ               | Znaczenie                                      |
| ----------- | ----------------- | ---------------------------------------------- |
| `id`        | `str`             | Unikalne ID zwracane w rekomendacjach          |
| `title`     | `str`             | Tytuł                                          |
| `tags`      | `tuple[str, ...]` | Tagi tematyczne, np. `("outdoors", "fitness")` |
| `starts_at` | `datetime`        | Data rozpoczęcia ze strefą czasową             |
| `city`      | `str`             | Miasto, możliwe do użycia jako filtr           |

W mock danych daty mają format ISO 8601, np. `2026-10-15T12:00:00+00:00`,
i są zamieniane na `datetime`. Tagi porównywane są bez rozróżniania wielkości liter.
Warto utrzymywać spójny słownik tagów: model nie rozpoznaje automatycznie synonimów.

Przeszłe wydarzenia również należy zachować w katalogu: ich tagi i interakcje
pomagają zbudować profil, mimo że same wydarzenia nie będą już polecane.

### Interakcja: `Interaction`

| Pole             | Typ                | Znaczenie                                                        |
| ---------------- | ------------------ | ---------------------------------------------------------------- |
| `user_id`        | `str`              | ID użytkownika                                                   |
| `event_id`       | `str`              | ID wydarzenia                                                    |
| `scroll_percent` | `float` lub `None` | Głębokość przewinięcia strony, 0–100; dla zapisu może być `None` |
| `occurred_at`    | `datetime`         | Data interakcji ze strefą czasową                                |
| `action`         | `str`              | `"view"` lub `"save"`; domyślnie `"view"`                        |
| `session_id`     | `str` lub `None`   | ID jednej wizyty na stronie wydarzenia                           |

W liście `behavior` w [mock_data.py](mock_data.py) kolejność pól to:
`(user_id, event_id, scroll_percent, occurred_at)`.
Zapisy i przykłady powrotów z `session_id` są dodawane osobno do `interactions`.

`session_id` identyfikuje **jedną wizytę na stronie**, nie sesję logowania:

- Aktualizacje scrolla podczas jednej wizyty mają ten sam identyfikator.
- Przy ponownym otwarciu strony należy utworzyć nowy identyfikator.
- Ponowne przesłanie tej samej interakcji nie tworzy nowej wizyty.
- Bez identyfikatora model grupuje oglądanie do jednej wizyty na dzień UTC.
  Nie odróżni wtedy dwóch powrotów tego samego dnia.
- Należy konsekwentnie przesyłać identyfikator: mieszanie interakcji z ID i bez ID
  dla tej samej wizyty może zawyżyć liczbę wizyt.

## 5. Agregacja historii

Dla każdej pary użytkownik–wydarzenie model wyznacza niezależnie:

1. **Najpóźniejszą datę interakcji** — do wyboru najnowszych wydarzeń w historii.
2. **Najwyższy scroll ze wszystkich wizyt** — późniejszy niższy scroll go nie obniża.
3. **Siłę zainteresowania** — oglądanie z bonusem za powroty lub zapis.

| Wczoraj | Dzisiaj | Zachowany scroll | Zachowana data |
| ------- | ------- | ---------------- | -------------- |
| 40%     | 100%    | 100%             | dzisiaj        |
| 100%    | 40%     | 100%             | dzisiaj        |

Daty nie są sumowane, a procenty scrolla nie są dodawane.
Kolejność przekazanych interakcji nie zmienia agregacji.
Interakcje późniejsze niż `as_of` są ignorowane.

Domyślnie wybieranych jest **100 ostatnich różnych wydarzeń na użytkownika**,
według daty jego ostatniej interakcji z każdym wydarzeniem. Nie jest to limit
100 pojedynczych aktualizacji scrolla. Przy remisie dat decyduje ID wydarzenia.
Powrót do starego wydarzenia może przesunąć je z powrotem do najnowszej historii.

Domyślnie **nie ma wygaszania danych po czasie**. Po pół roku nieaktywności
ostatnia znana historia nadal jest używana. Wydarzenia, których terminy już minęły,
przestają jednak być kandydatami do rekomendacji.

Agregaty dostępne w modelu:

- `history[user_id][event_id]` — siła zainteresowania.
- `history_latest_at[user_id][event_id]` — data ostatniej interakcji.
- `history_scroll_percent[user_id][event_id]` — najwyższy scroll dla oglądanych wydarzeń.
- `saved[user_id]` — zapisane wydarzenia zachowane w limicie historii.

## 6. Siła zainteresowania

Dla pojedynczej wizyty:

$$
v = 1 + 7 \cdot \frac{\text{scroll}}{100}
$$

Przykłady: 0% → 1; 40% → 3,8; 100% → 8.

Każda kolejna osobna wizyta daje bonus 5%, maksymalnie 20%:

$$
b = \min(0{,}20,\ 0{,}05 \cdot (\text{liczba wizyt}-1))
$$

Siła oglądania to najwyższa siła pojedynczej wizyty pomnożona przez $1+b$.
Przy 100% scrolla dwie wizyty dają 8,4; pięć lub więcej daje 9,6.
Zapis ma siłę **10**. Jeśli są zarówno oglądania, jak i zapisy, wybierana jest
wyższa siła, nie suma. Powtarzanie zapisów nie daje bonusu.

Scroll jest sygnałem zainteresowania, **nie dowodem przeczytania, rejestracji czy udziału**.

## 7. Obliczanie rankingu

Każde przyszłe wydarzenie otrzymuje trzy sygnały:

### Dopasowanie tagów: `content_score`

Siła interakcji z wydarzeniem jest dzielona równo między jego unikalne tagi.
Wkłady z różnych wydarzeń są sumowane w profilu użytkownika. Profil jest następnie
porównywany z tagami kandydata przez podobieństwo cosinusowe.

Przykład: częste i głębokie oglądanie wydarzeń z tagami `fitness` i `outdoors`
zwiększa dopasowanie przyszłych wydarzeń z tymi tagami, bez ankiety.

### Podobni użytkownicy: `collaborative_score`

Model porównuje historie użytkowników przez podobieństwo cosinusowe po wspólnych
ID wydarzeń. Wybiera do 20 sąsiadów o dodatnim podobieństwie. Ich zainteresowanie
kandydatem jest normalizowane względem najmocniejszej interakcji każdego sąsiada,
a następnie uśredniane z wagami podobieństwa.

### Popularność: `popularity_score`

Model sumuje siłę zainteresowania innych użytkowników danym wydarzeniem,
dzieloną przez 10. Następnie normalizuje wyniki względem najbardziej popularnego
kandydata. Wynik 1 oznacza najpopularniejszy z rozważanych kandydatów,
nie zainteresowanie wszystkich użytkowników.

### Wynik końcowy i sortowanie

Funkcja `get_recommended_event_ids()` używa `relevant_only=True`:

$$
\text{score} = 0{,}7 \cdot \text{content}
             + 0{,}2 \cdot \text{collaborative}
             + 0{,}1 \cdot \text{popularity}
$$

Jeśli cały sygnał dopasowania tagów lub podobnych użytkowników jest niedostępny,
jego waga jest zerowana, a pozostałe wagi normalizowane do sumy 1.
Dla nowego użytkownika bez historii i zainteresowań ranking opiera się na popularności.

Wyniki są sortowane według:

1. `score` malejąco.
2. Przy równych wynikach — `starts_at` rosnąco.
3. Przy równych wynikach i datach — ID wydarzenia rosnąco.

**Wynik nie jest prawdopodobieństwem**: 0,8 nie oznacza 80% szans zainteresowania.
Wagi i bonus za powroty są heurystykami, które wymagają oceny na rzeczywistych danych.

## 8. Filtrowanie

Funkcja zwracająca ID:

- Poleca tylko wydarzenia z `starts_at > as_of`.
- Pozwala ponownie polecić oglądane i zapisane wydarzenia — to nie oznacza udziału.
- Gdy są dopasowania tagów, pomija kandydatów z zerowym `content_score`.
- Gdy nie ma dopasowań tagów, ale jest sygnał sąsiadów, zachowuje dodatni `collaborative_score`.
- Gdy profil tagów istnieje, ale nie ma żadnego sygnału dopasowania, zwraca pustą listę.
- Bez profilu i sygnałów personalizacji korzysta z popularności, a przy braku
  wszystkich sygnałów z deterministycznej kolejności dat i ID.

Nie ma obecnie minimalnego progu dodatniego dopasowania ani mechanizmu różnorodności.
Nawet słabe dopasowanie jednego tagu może wejść do rankingu.

## 9. Konfiguracja i użycie z prawdziwymi danymi

```python
from recommender import EventRecommender

# users, events, interactions należy wczytać z własnego źródła danych.
model = EventRecommender(
    users,
    events,
    interactions,
    history_limit=100,
    neighbor_limit=20,
    half_life_days=None,
)
results = model.recommend(
    user_id,
    limit=12,
    exclude_seen=False,
    relevant_only=True,
    city="Warsaw",  # Opcjonalny filtr, bez rozróżniania wielkości liter.
)
event_ids = [result.event.id for result in results]
```

Bez `as_of` konstruktor używa aktualnego czasu UTC. Model jest snapshotem:
po nowych interakcjach lub zmianie danych trzeba go ponownie zbudować/odświeżyć.

Opcjonalnie `half_life_days=180` włącza zmniejszenie wagi o połowę co 180 dni.
**Nie jest to domyślna polityka ani twarde odcięcie historii.** W tym trybie wybierana
jest najmocniejsza interakcja po wygaszeniu; nie musi ona odpowiadać najwyższemu
surowemu scrollowi z `history_scroll_percent`.

Uwaga: bezpośrednie `model.recommend(user_id)` ma starsze domyślne ustawienia:
limit 5, wykluczanie oglądanych/zapisanych wydarzeń, `relevant_only=False`
oraz wagi 60% sąsiedzi, 30% tagi, 10% popularność.
Aby uzyskać politykę funkcji dla frontendu, należy przekazać parametry jak wyżej.

## 10. Podłączenie bazy i API — do wykonania

1. Frontend zbiera głębokość przewinięcia strony wydarzenia i ID wizyty.
2. Backend ustala użytkownika na podstawie uwierzytelnienia, zamiast ufać
   dowolnemu `user_id` przesłanemu przez klienta.
3. Backend waliduje i zapisuje interakcje z datą oraz identyfikatorem wizyty.
4. Ładowanie mock danych w [recommendations.py](recommendations.py) zastępuje się
   danymi z bazy, a stały `AS_OF` aktualnym czasem.
5. Endpoint zwraca uporządkowane ID; frontend pobiera szczegóły i zachowuje kolejność.

Daty ostatniego kontaktu i maksymalny scroll można aktualizować w bazie operacją
`max(stara_wartość, nowa_wartość)`, ale **same te dwa pola nie wystarczą** do obliczenia
bonusu za powroty: trzeba zachować wizyty/ich identyfikatory lub równoważną agregację.
Ponowne dostarczenie tych samych danych nie powinno zwiększać liczby wizyt.

Przy pobieraniu ostatnich 100 wydarzeń trzeba uwzględnić również wcześniejsze
interakcje z tymi wydarzeniami, aby nie zgubić najwyższego scrolla ani zapisów.
Obecna implementacja przyjmuje wszystkie przekazane interakcje i dopiero potem
ogranicza liczbę różnych wydarzeń. Nie optymalizuje jeszcze zapytań do bazy.

## 11. Testy i notebook

Z katalogu głównego repozytorium:

```powershell
python -m unittest discover -s sara -p "test_*.py"
```

Moduł rekomendacji wymaga wyłącznie standardowej biblioteki Pythona.
Notebook wymaga środowiska Jupyter; testy uruchomiono na Pythonie 3.14.8.

Testy obejmują m.in. kolejność rankingu, top 12, limit 100 wydarzeń, powrót po pół roku,
aktualizację daty, maksymalny scroll, bonus za wizyty, deduplikację aktualizacji,
nowych użytkowników i walidację danych.

W [sara.ipynb](sara.ipynb) uruchom komórki od początku. Pierwsza komórka przeładowuje
lokalne moduły, aby kolejne używały aktualnego kodu i mock danych.
