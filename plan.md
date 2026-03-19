
## 1. Projektübersicht

BerlinPuls ist eine Webanwendung, die eine KI-gestützte Agentensimulation der Berliner Bevölkerung realisiert. Das Ziel: Beliebige politische, gesellschaftliche oder stadtplanerische Fragestellungen durch eine synthetische Bevölkerung bewerten lassen – ähnlich einer quantitativen Umfrage, aber auf Basis von KI-Personas, die demografisch und soziostrukturell der realen Berliner Bevölkerung nachempfunden sind.

### Kernkonzept

- Der User gibt eine Fragestellung oder ein politisches Statement ein (z.B. "Sollte der Autoverkehr innerhalb des S-Bahn-Rings verboten werden?")
- Die App generiert N Personas (konfigurierbar, z.B. 50–500), verteilt über die 12 Berliner Bezirke, basierend auf realen demografischen Verteilungen
- Jede Persona wird einzeln über die OpenRouter-API befragt und gibt eine Bewertung (1–5 Skala) plus kurze Begründung ab
- Die Ergebnisse werden live auf einer Berlin-Karte visualisiert: jede Persona als farbiger Punkt an einer plausiblen Position im jeweiligen Bezirk
- Per Hover auf einen Punkt werden die Persona-Parameter und ihre Antwort sichtbar

### Technologie-Stack

- **Frontend/Backend:** SvelteKit (Svelte 5, Runes-Syntax) mit Vite
- **Karte:** Leaflet.js mit OpenStreetMap-Tiles
- **LLM-API:** OpenRouter (API-Key vom User als `.env`-Datei bereitgestellt)
- **Datenbank:** SQLite via better-sqlite3 (serverseitig, für Persistenz von Simulationen)
- **Styling:** Tailwind CSS

---

## 2. Datengrundlage – Recherchierte Quellen

Die Persona-Generierung basiert auf realen statistischen Daten der Berliner Bevölkerung. Folgende Quellen wurden recherchiert und sind als Grundlage zu verwenden:

### 2.1 Bevölkerungsstruktur pro Bezirk

**Quelle:** Amt für Statistik Berlin-Brandenburg – Einwohnerregisterstatistik
**URL:** https://www.statistik-berlin-brandenburg.de/a-i-5-hj/
**Inhalt:** Einwohnerbestand auf Ebene der 12 Bezirke und 96 Ortsteile, aufgeschlüsselt nach:
- Alter (Altersgruppen und Durchschnittsalter)
- Geschlecht
- Staatsangehörigkeit (deutsch / ausländisch, nach Herkunftsland)
- Migrationshintergrund (ja/nein, differenziert nach "deutsch mit Migrationshintergrund" und "Ausländer")
- Familienstand
- Konfession

**Relevante Eckdaten (Stand Ende 2024/2025):**

| Bezirk | Einwohner (ca.) | Ø Alter | Ausländeranteil | Migrationshintergrund |
|---|---|---|---|---|
| Mitte | 397.000 | 39,3 | ~37% | ~59% |
| Friedrichshain-Kreuzberg | 290.000 | 39,3 | ~30% | ~50% |
| Pankow | 427.000 | ~42 | ~17% | ~28% |
| Charlottenburg-Wilmersdorf | 340.000 | 45,2 | ~22% | ~38% |
| Spandau | 259.000 | ~43 | ~22% | ~35% |
| Steglitz-Zehlendorf | 310.000 | 46,6 | ~16% | ~27% |
| Tempelhof-Schöneberg | 350.000 | ~43 | ~23% | ~37% |
| Neukölln | 330.000 | ~41 | ~25% | ~52% |
| Treptow-Köpenick | 280.000 | ~44 | ~15% | ~26% |
| Marzahn-Hellersdorf | 280.000 | ~43 | ~17% | ~28% |
| Lichtenberg | 310.000 | ~42 | ~20% | ~32% |
| Reinickendorf | 270.000 | ~44 | ~20% | ~33% |

### 2.2 Wahlverhalten

**Quelle 1:** Landeswahlleiter Berlin – Abgeordnetenhauswahl 2023
**URL:** https://wahlen-berlin.de/wahlen/Be2023/AFSPRAES/agh/index.html
**Inhalt:** Zweitstimmenergebnisse pro Bezirk (AGH-Wahl 12.02.2023)

**Gesamtergebnis Berlin 2023:** CDU 28,2% | SPD 18,4% | Grüne 18,4% | Linke 12,2% | AfD 9,1% | FDP 4,6%

**Bezirksspezifische Wahlmuster (aus Recherche ableitbar):**

| Bezirk | Stärkste Partei(en) | Politische Tendenz |
|---|---|---|
| Mitte | Grüne, SPD stark | links-progressiv, gemischt |
| Friedrichshain-Kreuzberg | Grüne dominant (~38%) | stark links-grün |
| Pankow | Grüne im Süden (Prenzlauer Berg), CDU im Norden | gespalten |
| Charlottenburg-Wilmersdorf | CDU, Grüne | bürgerlich-liberal bis grün |
| Spandau | CDU, SPD | konservativ-sozialdemokratisch |
| Steglitz-Zehlendorf | CDU dominant | bürgerlich-konservativ |
| Tempelhof-Schöneberg | gespalten: Schöneberg grün, Tempelhof CDU | gemischt |
| Neukölln | Linke stark im Norden, CDU im Süden | polarisiert |
| Treptow-Köpenick | CDU, SPD, AfD relevant | konservativ bis rechts |
| Marzahn-Hellersdorf | AfD bis 28%, Linke stark | rechts bis links-populistisch |
| Lichtenberg | Linke traditionell stark, AfD wachsend | links bis rechts-populistisch |
| Reinickendorf | CDU dominant | konservativ |

**Quelle 2:** Bundestagswahl 2025 (23.02.2025)
**URL:** https://wahlen-berlin.de/wahlen/BU2025/afspraes/index.html
**Inhalt:** Wichtige Verschiebung – Linke gewann 6 von 12 Berliner Wahlkreisen, AfD erstmals stärkste Kraft in Marzahn-Hellersdorf, Grüne verloren Friedrichshain-Kreuzberg an Linke.

### 2.3 Soziale Lage

**Quelle:** Monitoring Soziale Stadtentwicklung Berlin 2023 (MSS 2023)
**URL:** https://www.berlin.de/sen/sbw/stadtdaten/stadtwissen/monitoring-soziale-stadtentwicklung/bericht-2023/
**Inhalt:** Sozialindex pro Planungsraum (542 PLR), basierend auf:
- Arbeitslosenquote (SGB II)
- Anteil Transferleistungsbeziehende (Bürgergeld)
- Kinderarmut (Kinder in SGB-II-Bedarfsgemeinschaften)
- Kinder/Jugendliche in alleinerziehenden Haushalten

**Gebiete mit besonderem Aufmerksamkeitsbedarf (sehr niedriger Sozialstatus):**
Wedding, Gesundbrunnen, Kreuzberg, Staaken, Neukölln, Neu-Hohenschönhausen, Marzahn, Hellersdorf, Märkisches Viertel, Reinickendorf.

**Tabellen als Excel verfügbar unter:**
https://www.berlin.de/sen/sbw/stadtdaten/stadtwissen/monitoring-soziale-stadtentwicklung/bericht-2023/tabellen-der-index-indikatoren/

### 2.4 Verarbeitung der Daten für die App

Die oben genannten Daten werden **nicht live abgefragt**, sondern als **statische JSON-Datei** (`src/lib/data/bezirke.json`) in die App eingebettet. Diese Datei enthält pro Bezirk:

```json
{
  "id": "mitte",
  "name": "Mitte",
  "einwohner": 397000,
  "anteil_gesamt": 0.102,
  "durchschnittsalter": 39.3,
  "altersverteilung": {
    "18-24": 0.09, "25-34": 0.22, "35-44": 0.18,
    "45-54": 0.14, "55-64": 0.13, "65-74": 0.10, "75+": 0.07
  },
  "geschlecht": { "m": 0.51, "w": 0.49, "d": 0.002 },
  "migrationshintergrund": 0.59,
  "auslaenderanteil": 0.37,
  "hauptherkunft": ["Türkei", "Polen", "Syrien", "Ukraine", "Italien"],
  "bildung": {
    "ohne_abschluss": 0.05, "hauptschule": 0.10, "realschule": 0.15,
    "abitur": 0.30, "studium": 0.35, "promotion": 0.05
  },
  "erwerbsstatus": {
    "angestellt": 0.52, "selbstaendig": 0.12, "arbeitslos": 0.055,
    "rente": 0.15, "ausbildung_studium": 0.10, "sonstiges": 0.055
  },
  "wahlverhalten_agh2023": {
    "CDU": 0.20, "SPD": 0.18, "Gruene": 0.28, "Linke": 0.15,
    "AfD": 0.06, "FDP": 0.04, "Sonstige": 0.09
  },
  "wahlverhalten_btw2025": {
    "CDU": 0.17, "SPD": 0.14, "Gruene": 0.22, "Linke": 0.25,
    "AfD": 0.07, "BSW": 0.06, "FDP": 0.02, "Sonstige": 0.07
  },
  "sozialindex": "mittel_bis_niedrig",
  "wohnlage": ["einfach", "mittel"],
  "miete_durchschnitt": 11.50,
  "bbox": {
    "lat_min": 52.503, "lat_max": 52.545,
    "lng_min": 13.330, "lng_max": 13.420
  }
}
```

Die `bbox` (Bounding Box) pro Bezirk wird verwendet, um Persona-Positionen zufällig innerhalb des Bezirksgebiets zu platzieren. Für genauere Platzierung können GeoJSON-Polygone der Bezirksgrenzen aus OpenStreetMap/Berlin Open Data verwendet werden.

**Datenaufbereitung:** Die Werte in `bezirke.json` werden manuell aus den recherchierten Quellen zusammengetragen und als feste Referenzdaten in die App eingebettet. Die Bildungs- und Erwerbsverteilungen werden aus Mikrozensus-Daten und dem MSS 2023 abgeleitet. Die Wahlverhaltensdaten stammen direkt aus den amtlichen Endergebnissen. Wo exakte Bezirksdaten fehlen, werden plausible Schätzungen auf Basis der Gesamtberliner Werte und der bekannten Bezirkscharakteristik vorgenommen – dies ist als Kommentar im Code zu dokumentieren.

---

## 3. Persona-Generierung

### 3.1 Algorithmus

1. **Bezirkszuweisung:** Personas werden proportional zur Einwohnerzahl auf die 12 Bezirke verteilt. Bei 100 Personas erhält Pankow (größter Bezirk) ca. 11, Spandau (kleinster) ca. 7.
2. **Attribut-Sampling:** Für jede Persona werden aus den bezirksspezifischen Verteilungen per gewichteter Zufallsauswahl Attribute gezogen:
   - Alter (aus Altersgruppen-Verteilung, dann Feinwert innerhalb der Gruppe)
   - Geschlecht
   - Migrationshintergrund (ja/nein), bei ja: Herkunftsregion
   - Bildungsabschluss
   - Erwerbsstatus
   - Ungefähre politische Tendenz (abgeleitet aus Wahlverhalten des Bezirks, mit Streuung)
   - Wohnlage (einfach/mittel/gut)
3. **Namensgebung:** Automatisch generierte, kulturell plausible Vornamen (deutsch, türkisch, arabisch, polnisch, etc.) basierend auf dem Migrationsattribut.
4. **Positionierung:** Zufällige Lat/Lng-Koordinate innerhalb der Bezirks-Bounding-Box (oder idealerweise innerhalb des GeoJSON-Polygons).

### 3.2 Persona-Steckbrief (wird als Prompt an LLM übergeben)

Jede generierte Persona wird als strukturierter Steckbrief formuliert. Beispiel:

```
Name: Ayşe K.
Alter: 34
Geschlecht: weiblich
Bezirk: Neukölln
Bildung: Realschulabschluss
Beruf: Einzelhandelskauffrau, angestellt
Migrationshintergrund: ja, türkisch
Politische Tendenz: eher links, wählt Linke
Wohnlage: einfach, Mietwohnung
Haushaltsnettoeinkommen: unterdurchschnittlich
```

Dieser Steckbrief wird zusammen mit der Fragestellung und der Systemanweisung (aus `agent.md`) an das LLM gesendet.

---

## 4. LLM-Interaktion

### 4.1 API-Anbindung

Die App nutzt **OpenRouter** als LLM-Gateway. Der API-Key wird vom User in einer `.env`-Datei bereitgestellt:

```env
API_KEY=sk-or-v1-xxxxxxxxxxxx

```

Modell: anthropic/claude-opus 4.6

Die API-Calls erfolgen **serverseitig** über SvelteKit Server Routes (`+server.ts`), um den API-Key nicht im Browser zu exponieren.

### 4.2 Request-Struktur

Für jede Persona wird ein einzelner API-Call gemacht:

```typescript
POST https://openrouter.ai/api/v1/chat/completions
{
  "model": "anthropic/claude-sonnet-4-20250514",
  "messages": [
    {
      "role": "system",
      "content": "<Inhalt von agent.md>"
    },
    {
      "role": "user",
      "content": "PERSONA:\n<Steckbrief>\n\nFRAGE:\n<User-Fragestellung>"
    }
  ],
  "max_tokens": 300,
  "temperature": 0.8
}
```

### 4.3 Erwartetes Antwortformat

Das LLM antwortet im folgenden JSON-Format (durch `agent.md` erzwungen):

```json
{
  "bewertung": 4,
  "haltung": "positiv",
  "begruendung": "Als Mutter von zwei Kindern finde ich es wichtig, dass die Luft in der Stadt sauberer wird. Weniger Autos bedeuten sicherere Schulwege."
}
```

- `bewertung`: Integer 1–5 (1 = stimme gar nicht zu, 5 = stimme voll zu)
- `haltung`: "positiv" | "negativ" | "neutral" (abgeleitet: 1-2 = negativ, 3 = neutral, 4-5 = positiv)
- `begruendung`: 1–3 Sätze, in der Ich-Perspektive der Persona

### 4.4 Parallelisierung und Rate Limiting

- API-Calls werden in Batches von 5–10 parallel gesendet (konfigurierbar)
- Zwischen Batches: 500ms Pause (Rate Limiting)
- Fortschritt wird per Server-Sent Events (SSE) an das Frontend gestreamt
- Bei Fehlern: 3 Retries mit exponentialem Backoff
---

## 6. UI/UX-Design

### 6.1 Layout

Die Hauptseite besteht aus zwei Bereichen:

**Linke Seite (oder oben auf Mobile): Steuerung**
- Textbox für die Fragestellung (mehrzeilig, Placeholder: "Gib eine Frage oder ein Statement ein, zu dem die Berliner Bevölkerung Stellung beziehen soll...")
- Slider oder Dropdown: Anzahl Personas (25 / 50 / 100 / 200 / 500)
- Dropdown: LLM-Modell (aus OpenRouter verfügbare Modelle)
- Button: "Simulation starten"
- Fortschrittsbalken während der Simulation
- Aggregierte Ergebnisse nach Abschluss:
  - Durchschnittliche Bewertung (1–5)
  - Verteilung als Balkendiagramm (wie viele 1er, 2er, 3er, 4er, 5er)
  - Aufschlüsselung nach Bezirk
  - Aufschlüsselung nach Demografie-Dimensionen (Alter, Geschlecht, Migration)

**Rechte Seite (oder unten auf Mobile): Karte**
- Leaflet-Karte mit OpenStreetMap-Tiles, zentriert auf Berlin (52.52, 13.405), Zoom ~11
- Bezirksgrenzen als halbtransparente Polygone eingezeichnet (aus GeoJSON)
- Jede Persona als kreisförmiger Marker (Radius 6–8px):
  - **Grau** (#9CA3AF): noch nicht befragt oder keine Haltung ("neutral")
  - **Grün** (#22C55E): positive Haltung (Bewertung 4–5)
  - **Rot** (#EF4444): negative Haltung (Bewertung 1–2)
  - **Gelb** (#EAB308): ambivalent (Bewertung 3)
  - Opacity: 0.8, mit dunklerem Border
- **Hover-Tooltip** auf jedem Punkt zeigt:
  ```
  Ayşe K., 34, weiblich
  Neukölln | Migrationshintergrund: türkisch
  Bildung: Realschule | Beruf: Einzelhandel
  Politische Tendenz: eher links
  ──────────
  Bewertung: 4/5 (positiv)
  "Als Mutter finde ich sicherere Schulwege wichtig."
  ```
- **Klick** auf einen Punkt öffnet ein Detail-Panel mit vollständiger Begründung
- Während der Simulation: Punkte erscheinen nacheinander und wechseln von grau zu ihrer Ergebnisfarbe (Animation)

### 6.2 Karten-Implementation

```typescript
// Leaflet mit OpenStreetMap
import L from 'leaflet';

const map = L.map('map').setView([52.52, 13.405], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
```

Die Bezirksgrenzen werden als GeoJSON-Layer hinzugefügt. Die Persona-Dots werden als `L.circleMarker` gerendert, da diese performanter sind als Icon-Marker (wichtig bei 500 Punkten).

---

## 7. Simulations-Ablauf (End-to-End)

1. **User gibt Frage ein** und wählt Persona-Anzahl (z.B. 100)
2. **Frontend sendet POST** an `/api/simulate` mit `{ question, count, model }`
3. **Server erstellt Simulation** in SQLite, generiert N Personas mit dem Persona-Generator
4. **Server speichert Personas** in SQLite (mit Koordinaten, aber ohne Bewertung)
5. **Server beginnt SSE-Stream** zum Frontend
6. **Für jede Persona** (in Batches):
   a. Server baut Prompt aus `agent.md` + Persona-Steckbrief + Frage
   b. Server sendet Request an OpenRouter
   c. Server parst die JSON-Antwort
   d. Server speichert Bewertung in SQLite
   e. Server sendet SSE-Event an Frontend: `{ persona_id, bewertung, haltung, begruendung }`
7. **Frontend aktualisiert** den entsprechenden Dot auf der Karte (Farbwechsel grau → Ergebnis)
8. **Nach Abschluss:** Server sendet SSE-Event `{ type: "complete", summary: {...} }`
9. **Frontend zeigt** aggregierte Ergebnisse an

---

## 10. Bekannte Limitierungen und Hinweise

### LLM-Bias
LLMs haben einen bekannten liberal-progressiven Bias. Die synthetische Bevölkerung wird daher vermutlich progressiver antworten als die reale. Dies ist kein Fehler der App, sondern eine Eigenschaft des Werkzeugs. In `agent.md` wird versucht, dem entgegenzuwirken, indem das Modell explizit angewiesen wird, die Persona authentisch zu verkörpern – auch wenn sie konservative oder populistische Positionen vertritt.
