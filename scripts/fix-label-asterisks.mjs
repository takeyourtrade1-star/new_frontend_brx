import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const dir = 'lib/i18n/messages';

const labelFixes = {
  it: {
    'registerForm.usernameLabel': 'Username',
    'registerForm.passwordLabel': 'Password',
    'registerForm.confirmPasswordLabel': 'Conferma password',
    'registerForm.emailLabel': 'Email',
    'registerForm.phoneLabel': 'Telefono',
    'registerForm.countryLabel': 'Paese',
    'registerForm.firstNameLabel': 'Nome',
    'registerForm.lastNameLabel': 'Cognome',
    'loginGate.emailLabel': 'Email o username',
    'loginGate.emailPlaceholder': 'Email o username',
    'loginGate.resendAvailable': 'Reinvia disponibile tra {time}',
  },
  en: {
    'registerForm.usernameLabel': 'Username',
    'registerForm.passwordLabel': 'Password',
    'registerForm.confirmPasswordLabel': 'Confirm password',
    'registerForm.emailLabel': 'Email',
    'registerForm.phoneLabel': 'Phone',
    'registerForm.countryLabel': 'Country',
    'registerForm.firstNameLabel': 'First name',
    'registerForm.lastNameLabel': 'Last name',
  },
  de: {
    'registerForm.usernameLabel': 'Benutzername',
    'registerForm.passwordLabel': 'Passwort',
    'registerForm.confirmPasswordLabel': 'Passwort bestätigen',
    'registerForm.emailLabel': 'E-Mail',
    'registerForm.phoneLabel': 'Telefon',
    'registerForm.countryLabel': 'Land',
    'registerForm.firstNameLabel': 'Vorname',
    'registerForm.lastNameLabel': 'Nachname',
  },
  fr: {
    'registerForm.usernameLabel': "Nom d'utilisateur",
    'registerForm.passwordLabel': 'Mot de passe',
    'registerForm.confirmPasswordLabel': 'Confirmer le mot de passe',
    'registerForm.emailLabel': 'E-mail',
    'registerForm.phoneLabel': 'Téléphone',
    'registerForm.countryLabel': 'Pays',
    'registerForm.firstNameLabel': 'Prénom',
    'registerForm.lastNameLabel': 'Nom',
  },
  es: {
    'registerForm.usernameLabel': 'Usuario',
    'registerForm.passwordLabel': 'Contraseña',
    'registerForm.confirmPasswordLabel': 'Confirmar contraseña',
    'registerForm.emailLabel': 'Correo electrónico',
    'registerForm.phoneLabel': 'Teléfono',
    'registerForm.countryLabel': 'País',
    'registerForm.firstNameLabel': 'Nombre',
    'registerForm.lastNameLabel': 'Apellido',
  },
  pt: {
    'registerForm.usernameLabel': 'Nome de utilizador',
    'registerForm.passwordLabel': 'Palavra-passe',
    'registerForm.confirmPasswordLabel': 'Confirmar palavra-passe',
    'registerForm.emailLabel': 'E-mail',
    'registerForm.phoneLabel': 'Telefone',
    'registerForm.countryLabel': 'País',
    'registerForm.firstNameLabel': 'Nome',
    'registerForm.lastNameLabel': 'Apelido',
  },
};

for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
  const code = file.replace('.ts', '');
  const fixes = labelFixes[code];
  if (!fixes) continue;

  const path = join(dir, file);
  let content = readFileSync(path, 'utf8');

  for (const [key, value] of Object.entries(fixes)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`  '${escapedKey}': '[^']*',`, 'g');
    content = content.replace(regex, `  '${key}': '${value.replace(/'/g, "\\'")}',`);
  }

  writeFileSync(path, content, 'utf8');
  console.log('fixed', code);
}
