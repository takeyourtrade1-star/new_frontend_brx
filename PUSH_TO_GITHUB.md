# Comandi per pushare tutto il frontend su GitHub

Apri il terminale e vai nella cartella del frontend, poi esegui in ordine:

```powershell
cd "c:\Users\Developper\Desktop\EBARTEX_AWS_Terraform-MacBook\Main-app\frontend\brx_frontend-main"
```

**Se non hai ancora inizializzato Git in questa cartella:**

```powershell
git init
git add .
git status
git commit -m "Initial commit: frontend Ebartex completo"
git remote add origin https://github.com/takeyourtrade1-star/new_frontend_brx.git
git branch -M main
git push -u origin main
```

**Se hai già fatto `git init` e il remote, ma non hai ancora pushato tutto:**

```powershell
git add .
git status
git commit -m "Aggiunto frontend completo"
git push -u origin main
```

**Se su GitHub c’è già solo il README e vuoi sostituirlo con tutto il progetto:**

```powershell
git add .
git commit -m "Frontend Ebartex completo"
git remote add origin https://github.com/takeyourtrade1-star/new_frontend_brx.git
git branch -M main
git push -u origin main --force
```

`--force` sovrascrive la storia sul remote (il README solo) con la tua cartella locale completa.

---

**Cosa viene inviato:** tutto tranne ciò che è nel `.gitignore` (node_modules, .next, .env, .env local, ecc.).  
**Cosa non viene inviato:** segreti e cartelle di build, come da `.gitignore`.
