# Future Prime Developer Setup Guide

This guide is for a new developer joining the project. It covers the recommended Windows + WSL setup for contributors who will use Visual Studio Code connected to WSL, plus a simpler local setup for Linux and macOS users.

## 1. Recommended environment for Windows users

For most Windows developers, the best setup is:
- Install Windows Subsystem for Linux (WSL 2)
- Open the repo inside WSL
- Use VS Code with the WSL extension
- Run Java, Node, Docker, and the app inside WSL

This gives a consistent Linux-like development environment and avoids the common issues that happen when mixing Windows-native tooling with Linux containers and Java builds.

### Install WSL 2
Open PowerShell as Administrator and run:
```powershell
wsl --install
```

If WSL is already installed, update it:
```powershell
wsl --update
```

Then reboot the machine if prompted.

### Install Ubuntu from the Microsoft Store or via WSL
After installation, open the Ubuntu terminal and set up your Linux environment.

### Install VS Code
Install Visual Studio Code on Windows.

Then install the extension:
- `WSL`

From VS Code, open:
```text
View -> Command Palette -> WSL: Reopen Folder in WSL
```

Then choose the cloned repository folder inside your WSL home directory, such as:
```text
~/projects/future-prime
```

This is the recommended developer experience for the team.

---

## 2. Clone the repository inside WSL

From the Ubuntu terminal:
```bash
mkdir -p ~/projects
cd ~/projects
git clone <your-repo-url>
cd future-prime
```

If the repo is already present locally in WSL, just open it in VS Code and continue.

---

## 3. Install required tools in WSL

### Install Java 21
```bash
sudo apt update
sudo apt install -y openjdk-21-jdk
java -version
```

Expected output should show OpenJDK 21.

### Install Node.js and npm
```bash
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### Install Docker Desktop for Windows
Install Docker Desktop on Windows and make sure it is running.

Then inside WSL, Docker should be available via the Docker Desktop integration.

Verify:
```bash
docker --version
docker compose version
```

### Install Git
```bash
git --version
```

If Git is not installed:
```bash
sudo apt install -y git
```

---

## 4. Project prerequisites

The project requires:
- Java 21
- Node.js 18+
- Docker + Docker Compose
- Git

The repo already contains the Maven wrapper in `backend/`, so you usually do not need to install Maven separately.

---

## 5. Run the app with Docker (recommended)

From the repo root:
```bash
cd ~/projects/future-prime
docker compose up --build -d
```

Then open:
```text
http://localhost:8080
```

To view logs:
```bash
docker compose logs -f app
```

To stop everything:
```bash
docker compose down
```

---

## 6. Run the backend manually

If you want to work on the Java API directly:
```bash
cd ~/projects/future-prime/backend
./mvnw clean package -DskipTests
./mvnw spring-boot:run
```

The app will start on:
```text
http://localhost:8080
```

---

## 7. Build the frontend assets

The frontend is a Vite app. Build it and copy the static output into the backend before packaging the app.

From the repo root:
```bash
cd ~/projects/future-prime
./build-ui.sh
```

This will:
- build the React frontend
- copy static files into the backend resources folder
- package the backend JAR

The generated JAR will appear under:
```text
backend/target/
```

---

## 8. Open the repo in VS Code via WSL

From within VS Code on Windows:
1. Click the green `><` button in the bottom-left corner
2. Choose `Reopen Folder in WSL`
3. Select the repo folder inside WSL, e.g. `~/projects/future-prime`

Now all terminal commands run in Linux/WSL, which is the recommended setup for this project.

---

## 9. Windows-specific developer workflow

For a Windows user using WSL, the standard flow is:
```bash
cd ~/projects/future-prime

docker compose up --build -d
# or
cd backend
./mvnw spring-boot:run
```

Then from the browser open:
```text
http://localhost:8080
```

Because the app is being served from WSL, the port is exposed to Windows via localhost, so the browser on Windows can still access it normally.

---

## 10. Local setup for Linux and macOS developers

For Linux and macOS users, the setup is simpler. They can clone the project locally on their machine and run the same commands directly, without WSL.

### Requirements
- Java 21
- Node.js 18+
- Docker (if using compose)
- Git

### Commands
```bash
git clone <repo-url>
cd future-prime

docker compose up --build -d
```

Or run the backend manually:
```bash
cd backend
./mvnw spring-boot:run
```

---

## 11. Daily development routine

Recommended steps for contributors:
```bash
cd ~/projects/future-prime

docker compose up -d db
./build-ui.sh
cd backend
./mvnw spring-boot:run
```

When done:
```bash
docker compose down
```

---

## 12. Troubleshooting

### Home page returns 403
This is usually caused by the frontend not being built or the backend not being restarted after the UI build. Check:
```bash
cd ~/projects/future-prime
./build-ui.sh
cd backend
./mvnw spring-boot:run
```

### Docker cannot connect
Ensure Docker Desktop is running on Windows and WSL integration is enabled.

### Java not found
Check:
```bash
java -version
```
If needed, install Java 21.

### Port 8080 already in use
Stop the conflicting process or change the port in the app config.

---

## 13. Recommended path for the team

Use this path for the standard developer experience:
- Windows user -> WSL 2 + VS Code + Docker + Java + Node in WSL
- Linux/macOS user -> native local checkout and local run

This keeps the environment consistent and avoids Windows-specific build surprises.

---

## 14. Quick-start commands

### Windows + WSL setup
```bash
mkdir -p ~/projects
cd ~/projects
git clone <repo-url>
cd future-prime
java -version
node -v
npm -v
docker --version

docker compose up --build -d
```

### Linux/macOS native setup
```bash
git clone <repo-url>
cd future-prime
docker compose up --build -d
```

---

## 15. Summary

The best setup for a Windows developer is:
- WSL 2
- VS Code with WSL extension
- repo checked out inside WSL
- Java, Node, and Docker installed inside WSL

Linux and macOS developers can simply use a normal local checkout and run the project on their machine.
