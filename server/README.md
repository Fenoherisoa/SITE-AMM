# Serveur Principal AMM — Synchronisation Réseau Local Wi-Fi (Offline-First)

Ce service permet de transformer un ordinateur Windows en **Serveur d'Autorité Locale** sur le réseau Wi-Fi local de l'Association Malagasy Miray (AMM), permettant aux téléphones Android et autres ordinateurs de collaborer et de synchroniser toutes leurs données sans nécessiter de connexion Internet.

---

## 1. Prérequis & Installation

- **Node.js** version 18 ou supérieure installée sur l'ordinateur Windows.
- Les appareils (ordinateurs et téléphones Android) doivent être connectés au **même réseau Wi-Fi** (ou point d'accès mobile).

---

## 2. Configuration du Pare-feu Windows (Obligatoire)

Pour autoriser les téléphones Android et autres postes à communiquer avec le serveur sur le port `4000` :

1. Ouvrez le **Panneau de configuration** > **Système et sécurité** > **Pare-feu Windows Defender**.
2. Cliquez sur **Paramètres avancés** (dans le volet de gauche).
3. Sélectionnez **Règles de trafic entrant** > **Nouvelle règle...**.
4. Choisissez **Port** > Suivant.
5. Sélectionnez **TCP** et entrez le port : `4000` > Suivant.
6. Choisissez **Autoriser la connexion** > Suivant.
7. Cochez **Privé** (et Domaine si applicable) > Suivant.
8. Nommez la règle : `AMM Serveur Local LAN` > Terminer.

---

## 3. Démarrage du Serveur

### Méthode 1 : Double-clic sur Windows
Double-cliquez simplement sur le fichier `start-lan-server.bat` à la racine du projet.

### Méthode 2 : Ligne de commande
```bash
npm run lan:server
# ou
npx tsx server/lanServer.ts
```

Le serveur démarre et affiche :
```
  SERVEUR PRINCIPAL AMM - SYNCHRONISATION LOCALE WI-FI
  Port : 4000 | Hôte : 0.0.0.0
  Code PIN d'appairage par défaut : 123456
  Base locale persistante : server/data/lan_db.json
```

---

## 4. Trouver l'adresse IP de votre Ordinateur Windows

1. Appuyez sur `Touche Windows + R`, tapez `cmd` et validez.
2. Tapez la commande :
   ```cmd
   ipconfig
   ```
3. Repérez l'adresse **IPv4** de votre carte Wi-Fi (ex. `192.168.1.50` ou `192.168.43.1`).

---

## 5. Connexion des Clients (Android et Windows)

1. Ouvrez l'application AMM sur le téléphone ou l'ordinateur client.
2. Dans la barre supérieure ou le menu, cliquez sur le badge **Synchronisation & Réseau Local**.
3. Rendez-vous dans l'onglet **Réseau Local (Wi-Fi LAN)**.
4. Saisissez l'adresse IP du serveur (ex. `192.168.1.50`) et le port `4000`.
5. Cliquez sur **Tester la connexion**.
6. Entrez le code PIN de sécurité (par défaut : `123456`) et cliquez sur **Appairer cet appareil**.
7. L'appareil est immédiatement appairé et synchronisera ses données en temps réel sur le Wi-Fi local !

---

## 6. Synchronisation avec Firebase

Dès que l'ordinateur serveur principal retrouve un accès à Internet, il pousse automatiquement toutes les modifications accumulées vers la base centrale Firebase Realtime Database.
