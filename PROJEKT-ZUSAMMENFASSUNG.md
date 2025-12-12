# Projekt-Zusammenfassung: Bacchus+

## Projekt-Übersicht

**Bacchus+** ist eine mobile und Web-Anwendung zur Verwaltung und Verfolgung von Suchtverhalten. Die App ermöglicht es Benutzern, ihre Abhängigkeiten zu dokumentieren, Konsumeinträge zu erfassen, Fortschritte zu verfolgen und durch Streaks und Meilensteine motiviert zu bleiben.

## Technologie-Stack

### Frontend-Framework
- **Angular 20.0.0** (Standalone Components)
- **Ionic 8.0.0** (UI-Framework für mobile Apps)
- **TypeScript 5.9.0**
- **SCSS** für Styling

### Backend & Datenbank
- **Supabase** (Backend-as-a-Service)
  - PostgreSQL-Datenbank
  - Authentifizierung (Email/Password, OAuth: Spotify, Figma)
  - REST API via Supabase Client

### Mobile Plattform
- **Capacitor 7.4.4** (Cross-Platform Framework)
- **Android** Support (APK-Build vorhanden)
- Native Plugins:
  - `@capacitor/camera` - Kamera-Zugriff
  - `@capacitor/local-notifications` - Lokale Benachrichtigungen
  - `@capacitor/haptics` - Haptisches Feedback
  - `@capacitor/filesystem` - Dateisystem-Zugriff
  - `@capacitor/preferences` - Lokale Einstellungen
  - `@capacitor/keyboard` - Keyboard-Handling
  - `@capacitor/status-bar` - Status-Bar-Kontrolle

### Build & Development Tools
- Angular CLI 20.0.0
- ESLint für Code-Qualität
- Karma & Jasmine für Tests
- Gradle für Android-Builds

## Projekt-Struktur

```
src/
├── app/
│   ├── app.component.ts          # Root-Komponente, initialisiert Theme, Notifications, Auth
│   ├── app.routes.ts             # Haupt-Routing (Login, Tabs)
│   ├── guards/
│   │   └── auth.guard.ts         # Route Guard für Authentifizierung
│   ├── pages/
│   │   ├── login/                # Login-Seite (Email/Password, OAuth)
│   │   ├── home/                 # Startseite mit Navigation
│   │   ├── focus/                # Suchtverhalten verwalten (CRUD)
│   │   ├── entry/                # Konsumeinträge erstellen/bearbeiten
│   │   ├── progress/             # Fortschritt & Streaks visualisieren
│   │   └── settings/             # App-Einstellungen (Theme, Logout)
│   ├── services/
│   │   ├── supabase.service.ts           # Supabase Client & Auth
│   │   ├── addiction.service.ts          # CRUD für Suchtverhalten
│   │   ├── consumption-entry.service.ts  # CRUD für Konsumeinträge
│   │   ├── streak.service.ts             # Streak-Berechnung & -Verwaltung
│   │   ├── notification.service.ts       # Lokale & Web-Benachrichtigungen
│   │   ├── theme.service.ts              # Dark/Light Mode
│   │   ├── haptic.service.ts             # Haptisches Feedback
│   │   └── image-upload.service.ts       # Bild-Upload zu Supabase Storage
│   └── tabs/
│       └── tabs.routes.ts        # Tab-Navigation (Home, Focus, Entry, Progress, Settings)
├── environments/
│   ├── environment.ts            # Dev-Environment (Supabase Credentials)
│   └── environment.prod.ts       # Production-Environment
└── theme/
    └── variables.scss            # Ionic Theme-Variablen
```

## Datenbank-Schema

### Tabelle: `addictions`
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `name` (text, NOT NULL)
- `description` (text)
- `level` (integer, 1-10, Default: 1)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Tabelle: `consumption_entries`
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `addiction_id` (uuid, FK → addictions)
- `entry_date` (timestamp, Default: now())
- `image_url` (text)
- `barcode_data` (text)
- `notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Tabelle: `streaks`
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `addiction_id` (uuid, FK → addictions)
- `current_streak` (integer, Default: 0)
- `longest_streak` (integer, Default: 0)
- `last_entry_date` (timestamp)
- `updated_at` (timestamp)
- Unique Constraint: `(user_id, addiction_id)`

### Tabelle: `user_settings`
- `id` (uuid, PK)
- `user_id` (uuid, UNIQUE, FK → auth.users)
- `dark_mode` (boolean, Default: false)
- `notifications_enabled` (boolean, Default: true)
- `reminder_frequency` (text, Default: 'daily')
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Kern-Funktionalitäten

### 1. Authentifizierung
- **Email/Password Login** via Supabase Auth
- **OAuth Login** (Spotify, Figma)
- **Session Management** mit automatischer Weiterleitung
- **Auth Guard** schützt alle Routes außer Login

### 2. Suchtverhalten-Verwaltung (Addictions)
- **CRUD-Operationen** für Suchtverhalten
- **Intensitätslevel** (1-10) bestimmt Benachrichtigungsintervall
- **Automatische Benachrichtigungsplanung** bei Erstellung/Update
- **Benachrichtigungen werden gelöscht** beim Löschen eines Suchtverhaltens

### 3. Konsumeinträge (Consumption Entries)
- **Einträge erstellen** mit Datum, Notizen, Bildern
- **Bild-Upload** via Kamera oder Galerie zu Supabase Storage
- **Barcode-Scanning** (vorbereitet, Feld vorhanden)
- **Automatische Streak-Berechnung** bei Erstellung/Löschung
- **Chronologische Sortierung** (neueste zuerst)

### 4. Streak-System
- **Aktueller Streak**: Aufeinanderfolgende Tage mit Einträgen
- **Längster Streak**: Höchster jemals erreichter Streak
- **Automatische Berechnung** basierend auf `entry_date`
- **Streak wird unterbrochen** wenn mehr als 1 Tag zwischen Einträgen liegt
- **Mehrere Einträge am selben Tag** brechen Streak nicht

### 5. Benachrichtigungssystem
- **Plattform-spezifisch**:
  - **Native (Android)**: Capacitor Local Notifications
  - **Web**: Browser Notification API mit setInterval
- **Intervall-Berechnung** basierend auf Level:
  - Level 1: 30 Minuten
  - Level 10: 1 Minute
  - Linear interpoliert: `interval = 30 - (level - 1) * (29 / 9)`
- **Automatische Planung** bei Addiction-Erstellung/Update
- **Berechtigungsanfrage** beim App-Start
- **Benachrichtigungen werden gecancelt** beim Logout

### 6. Fortschritts-Tracking
- **Meilensteine**: 7, 30, 60, 90, 180, 365 Tage
- **Fortschrittsstufen**: Starting, Beginner, Intermediate, Advanced, Expert, Master
- **Visuelle Darstellung** mit Fortschrittsbalken
- **Gesamtstatistiken**: Einträge, Streaktage

### 7. Theme-Management
- **Dark/Light Mode** Toggle
- **Persistierung** in Capacitor Preferences
- **System-Präferenz** als Fallback
- **Automatische Anwendung** beim App-Start

### 8. Haptisches Feedback
- **Button-Clicks** mit Vibration
- **Verbesserte UX** bei Interaktionen

## Routing-Struktur

```
/login                    # Login-Seite (öffentlich)
/tabs                     # Haupt-App (geschützt)
  ├── /tabs/home          # Startseite
  ├── /tabs/focus         # Suchtverhalten verwalten
  ├── /tabs/entry         # Konsumeintrag erstellen
  ├── /tabs/progress      # Fortschritt anzeigen
  └── /tabs/settings      # Einstellungen
```

## Service-Architektur

### SupabaseService
- Zentraler Supabase Client
- Auth-Methoden: `signIn`, `signUp`, `signOut`, `signInWithOAuth`
- Session-Management: `getSession`, `getCurrentUser`
- Auth State Change Listener

### AddictionService
- `getAllAddictions()`: Alle Suchtverhalten des Users
- `getAddictionById(id)`: Einzelnes Suchtverhalten
- `createAddiction(addiction)`: Erstellt + plant Benachrichtigung
- `updateAddiction(id, updates)`: Aktualisiert + plant Benachrichtigung neu
- `deleteAddiction(id)`: Löscht + canceliert Benachrichtigung

### ConsumptionEntryService
- `getAllEntries(addictionId?)`: Alle Einträge (optional gefiltert)
- `getEntryById(id)`: Einzelner Eintrag
- `createEntry(entry)`: Neuer Eintrag
- `updateEntry(id, updates)`: Eintrag aktualisieren
- `deleteEntry(id)`: Eintrag löschen

### StreakService
- `getStreak(addictionId)`: Streak für ein Suchtverhalten
- `getAllStreaks()`: Alle Streaks des Users
- `calculateStreak(addictionId)`: Berechnet aktuellen & längsten Streak
- **Algorithmus**: Iteriert durch Einträge, prüft auf aufeinanderfolgende Tage

### NotificationService
- `requestPermissions()`: Fragt Berechtigungen an
- `scheduleAddictionNotification(addiction)`: Plant wiederkehrende Benachrichtigung
- `cancelAddictionNotification(addictionId)`: Stoppt Benachrichtigung
- `cancelAllNotifications()`: Stoppt alle Benachrichtigungen
- `getIntervalForLevel(level)`: Formatiert Intervall als String

### ThemeService
- `initTheme()`: Lädt gespeicherte Präferenz oder System-Präferenz
- `toggleTheme()`: Wechselt zwischen Dark/Light
- `setTheme(isDark)`: Setzt explizit Theme
- `isDark()`: Gibt aktuellen Modus zurück

## App-Initialisierung (app.component.ts)

1. **Theme initialisieren** (`themeService.initTheme()`)
2. **Benachrichtigungsberechtigungen anfragen** (`notificationService.requestPermissions()`)
3. **Auth State Change Listener**:
   - Bei `SIGNED_IN`: Navigiere zu `/tabs/home`, plane alle Benachrichtigungen
   - Bei `SIGNED_OUT`: Cancel alle Benachrichtigungen, navigiere zu `/login`
4. **Initiale Session-Prüfung**: Wenn Session existiert, plane Benachrichtigungen

## Konfiguration

### Capacitor Config (`capacitor.config.ts`)
- **App ID**: `io.ionic.starter`
- **App Name**: `bacchus+`
- **Web Dir**: `www`
- **Android Scheme**: `https`
- **Splash Screen**: 2s Anzeige, weißer Hintergrund

### Environment Variables
- `supabaseUrl`: Supabase Projekt-URL
- `supabaseAnonKey`: Supabase Anon Key (öffentlich)

## Build & Deployment

### Development
```bash
npm start          # Angular Dev Server
npm run build      # Production Build
```

### Android Build
- Gradle-basiert
- Keystore vorhanden: `android/app/bacchus-release-key.keystore`
- APK-Output: `app-release.apk`

### Build-Output
- **Web**: `www/` Verzeichnis
- **Android**: `android/app/build/outputs/apk/`

## User Stories (Implementiert)

1. ✅ **Suchtverhalten verwalten**: CRUD mit Level 1-10, automatische Benachrichtigungen
2. ✅ **Konsumeinträge erfassen**: Datum, Notizen, Bilder, automatische Streak-Berechnung
3. ✅ **Fortschritt verfolgen**: Streaks, Meilensteine, Fortschrittsstufen
4. ✅ **Benachrichtigungen**: Level-basierte Intervalle, plattformübergreifend
5. ✅ **Einstellungen**: Theme-Toggle, Logout, Benachrichtigungen testen

## Wichtige Design-Entscheidungen

1. **Standalone Components**: Angular 20 verwendet Standalone Components (keine NgModules)
2. **Service-basierte Architektur**: Business-Logik in Services, Komponenten sind dünn
3. **Automatische Streak-Berechnung**: Wird bei jedem Entry-Create/Delete ausgelöst
4. **Plattform-spezifische Notifications**: Unterschiedliche Implementierung für Web/Native
5. **User-Isolation**: Alle Queries filtern nach `user_id` für Sicherheit
6. **OAuth Redirect Handling**: Unterschiedliche URLs für Native/Web

## Offene Punkte / Erweiterungsmöglichkeiten

- Barcode-Scanning ist vorbereitet (`barcode_data` Feld), aber noch nicht implementiert
- `user_settings` Tabelle existiert, aber wird noch nicht vollständig genutzt
- `reminder_frequency` Feld vorhanden, aber aktuell nur Level-basiert
- Production Environment Variables müssen noch konfiguriert werden

## Abhängigkeiten (Key Dependencies)

- `@angular/*`: 20.0.0
- `@ionic/angular`: 8.0.0
- `@supabase/supabase-js`: 2.87.0
- `@capacitor/*`: 7.x
- `rxjs`: 7.8.0
- `ionicons`: 7.0.0

## Sicherheits-Hinweise

- **Row Level Security (RLS)** sollte in Supabase aktiviert sein
- **Environment Variables** sollten nicht in Git committed werden (aktuell in Dev-Environment)
- **OAuth Redirect URLs** müssen in Supabase konfiguriert sein
- **User-Isolation**: Alle Services prüfen `user_id` vor Datenzugriff

