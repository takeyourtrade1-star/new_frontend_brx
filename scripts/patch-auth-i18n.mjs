import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const dir = 'lib/i18n/messages';

const baseEn = {
  'auth.back': 'Back',
  'pages.register.subtitle': 'Create your account in seconds.',
  'pages.login.demoLanding.description':
    'Explore the platform and see how auctions, purchases, and account management will work. Everything is under development and you may encounter bugs or minor issues.',
  'pages.login.demoLanding.supportText': 'Having trouble? Email us at',
  'pages.login.demoLanding.ctaLogin': 'Sign in',
  'pages.login.demoLanding.exploreSite': 'Explore the site',
  'pages.login.demoLanding.footerNote': 'The demo may change as we build new features.',
  'pages.login.registerLink': 'Sign up',
  'loginForm.loginWithCode': 'Sign in with one-time code',
  'loginGate.title': 'Sign in or register to bid',
  'loginGate.subtitle': 'It only takes a few seconds to join the auction.',
  'loginGate.emailLabel': 'Email or username',
  'loginGate.emailPlaceholder': 'Email or username',
  'loginGate.register': 'Sign up',
  'loginGate.login': 'Sign in',
  'loginGate.closeAria': 'Close',
  'loginGate.termsNote': 'By continuing you accept Ebartex Terms of Service and Privacy Policy.',
  'loginGate.welcomeBack': 'Welcome back',
  'loginGate.passwordFor': 'Enter the password for',
  'loginGate.passwordLabel': 'Password',
  'loginGate.passwordPlaceholder': 'Enter your password',
  'loginGate.loggingIn': 'Signing in…',
  'loginGate.or': 'or',
  'loginGate.loginWithCode': 'Sign in with one-time code',
  'loginGate.sendingCode': 'Sending code…',
  'loginGate.forgotPassword': 'Forgot password?',
  'loginGate.checkEmail': 'Check your email',
  'loginGate.codeSentTo': 'We sent an 8-character code to',
  'loginGate.resendAvailable': 'Resend available in {time}',
  'loginGate.resendHint': "Didn't receive the code?",
  'loginGate.resendCode': 'Resend code',
  'loginGate.emailRequired': 'Enter email or username.',
  'loginGate.passwordRequired': 'Enter your password.',
  'loginGate.codeEmailRequired': 'Enter a valid email address for the one-time code.',
  'registerForm.requiredFieldsLegend': 'Required field',
  'registerForm.countryPlaceholder': 'Select country',
  'registerForm.termsAccepted': 'I accept the {link}',
  'registerForm.specificClausesAccepted':
    'Pursuant to Articles 1341 and 1342 of the Italian Civil Code, I specifically approve the clauses set out in the {link}',
  'registerForm.privacyAccepted': 'I have read and accept the {link}',
  'registerForm.termsLink': 'Terms and Conditions of Service',
  'registerForm.privacyLink': 'Privacy Policy',
  'countrySelect.placeholder': 'Select…',
  'countrySelect.searchPlaceholder': 'Search country…',
  'countrySelect.empty': 'No country found',
  'registrati.privato.title': 'Private account',
  'registrati.privato.backToChoice': 'Back to registration',
  'registrati.privato.hasAccount': 'Already have an account? Sign in',
  'registerForm.usernameLabel': 'Username',
  'registerForm.passwordLabel': 'Password',
  'registerForm.confirmPasswordLabel': 'Confirm password',
  'registerForm.emailLabel': 'Email',
  'registerForm.phoneLabel': 'Phone',
  'registerForm.countryLabel': 'Country',
  'registerForm.firstNameLabel': 'First name',
  'registerForm.lastNameLabel': 'Last name',
};

const patches = {
  it: {
    ...baseEn,
    'auth.back': 'Indietro',
    'pages.register.subtitle': 'Crea il tuo account in pochi secondi.',
    'pages.login.demoLanding.description':
      "Qui puoi esplorare la piattaforma e farti un'idea di come funzioneranno aste, acquisti e gestione del tuo account. Tutto è in fase di sviluppo e potresti incontrare bug o piccole imperfezioni.",
    'pages.login.demoLanding.supportText': 'Problemi? Scrivici a',
    'pages.login.demoLanding.ctaLogin': 'Accedi',
    'pages.login.demoLanding.exploreSite': 'Esplora il sito',
    'pages.login.demoLanding.footerNote': 'La demo potrebbe cambiare mentre lavoriamo su nuove funzionalità.',
    'pages.login.registerLink': 'Registrati',
    'loginForm.loginWithCode': 'Accedi con codice monouso',
    'loginGate.title': 'Accedi o registrati per offrire',
    'loginGate.subtitle': "Bastano pochi secondi per partecipare all'asta.",
    'loginGate.register': 'Registrati',
    'loginGate.login': 'Accedi',
    'loginGate.closeAria': 'Chiudi',
    'loginGate.termsNote': 'Continuando accetti i Termini di Servizio e la Privacy Policy di Ebartex.',
    'loginGate.welcomeBack': 'Bentornato',
    'loginGate.passwordFor': 'Inserisci la password di',
    'loginGate.passwordPlaceholder': 'Inserisci la password',
    'loginGate.loggingIn': 'Accesso in corso…',
    'loginGate.or': 'oppure',
    'loginGate.loginWithCode': 'Accedi con codice monouso',
    'loginGate.sendingCode': 'Invio codice…',
    'loginGate.forgotPassword': 'Password dimenticata?',
    'loginGate.checkEmail': 'Controlla la tua email',
    'loginGate.codeSentTo': 'Abbiamo inviato un codice a 8 caratteri a',
    'loginGate.resendHint': 'Non hai ricevuto il codice?',
    'loginGate.resendCode': 'Reinvia codice',
    'loginGate.emailRequired': 'Inserisci email o username.',
    'loginGate.passwordRequired': 'Inserisci la password.',
    'loginGate.codeEmailRequired': 'Per il codice monouso inserisci un indirizzo email valido.',
    'registerForm.requiredFieldsLegend': 'Campo obbligatorio',
    'registerForm.countryPlaceholder': 'Seleziona paese',
    'registerForm.termsAccepted': 'Accetto i {link}',
    'registerForm.specificClausesAccepted':
      'Ai sensi degli artt. 1341 e 1342 c.c., approvo specificamente le clausole indicate nei {link}',
    'registerForm.privacyAccepted': 'Ho letto e accetto la {link}',
    'registerForm.termsLink': 'Termini e Condizioni di Servizio',
    'registerForm.privacyLink': 'Privacy Policy',
    'countrySelect.placeholder': 'Seleziona…',
    'countrySelect.searchPlaceholder': 'Cerca paese…',
    'countrySelect.empty': 'Nessun paese trovato',
    'registrati.privato.title': 'Account privato',
    'registrati.privato.backToChoice': 'Torna alla registrazione',
    'registrati.privato.hasAccount': 'Hai già un account? Accedi',
    'registerForm.usernameLabel': 'Username',
    'registerForm.passwordLabel': 'Password',
    'registerForm.confirmPasswordLabel': 'Conferma password',
    'registerForm.emailLabel': 'Email',
    'registerForm.phoneLabel': 'Telefono',
    'registerForm.countryLabel': 'Paese',
    'registerForm.firstNameLabel': 'Nome',
    'registerForm.lastNameLabel': 'Cognome',
  },
  en: baseEn,
  de: {
    ...baseEn,
    'auth.back': 'Zurück',
    'pages.register.subtitle': 'Erstelle dein Konto in wenigen Sekunden.',
    'registerForm.requiredFieldsLegend': 'Pflichtfeld',
    'registerForm.countryPlaceholder': 'Land auswählen',
    'registerForm.termsAccepted': 'Ich akzeptiere die {link}',
    'registerForm.specificClausesAccepted':
      'Gemäß Art. 1341 und 1342 des italienischen Zivilgesetzbuchs genehmige ich ausdrücklich die in den {link} genannten Klauseln',
    'registerForm.privacyAccepted': 'Ich habe die {link} gelesen und akzeptiere sie',
    'registerForm.termsLink': 'Allgemeine Geschäftsbedingungen',
    'registerForm.privacyLink': 'Datenschutzrichtlinie',
    'countrySelect.placeholder': 'Auswählen…',
    'countrySelect.searchPlaceholder': 'Land suchen…',
    'countrySelect.empty': 'Kein Land gefunden',
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
    ...baseEn,
    'auth.back': 'Retour',
    'pages.register.subtitle': 'Créez votre compte en quelques secondes.',
    'registerForm.requiredFieldsLegend': 'Champ obligatoire',
    'registerForm.countryPlaceholder': 'Sélectionner un pays',
    'registerForm.termsAccepted': "J'accepte les {link}",
    'registerForm.specificClausesAccepted':
      "Conformément aux articles 1341 et 1342 du code civil italien, j'approuve spécifiquement les clauses indiquées dans les {link}",
    'registerForm.privacyAccepted': "J'ai lu et j'accepte la {link}",
    'registerForm.termsLink': 'Conditions générales de service',
    'registerForm.privacyLink': 'Politique de confidentialité',
    'countrySelect.placeholder': 'Sélectionner…',
    'countrySelect.searchPlaceholder': 'Rechercher un pays…',
    'countrySelect.empty': 'Aucun pays trouvé',
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
    ...baseEn,
    'auth.back': 'Volver',
    'pages.register.subtitle': 'Crea tu cuenta en segundos.',
    'registerForm.requiredFieldsLegend': 'Campo obligatorio',
    'registerForm.countryPlaceholder': 'Seleccionar país',
    'registerForm.termsAccepted': 'Acepto los {link}',
    'registerForm.specificClausesAccepted':
      'De conformidad con los artículos 1341 y 1342 del Código Civil italiano, apruebo específicamente las cláusulas indicadas en los {link}',
    'registerForm.privacyAccepted': 'He leído y acepto la {link}',
    'registerForm.termsLink': 'Términos y Condiciones de Servicio',
    'registerForm.privacyLink': 'Política de privacidad',
    'countrySelect.placeholder': 'Seleccionar…',
    'countrySelect.searchPlaceholder': 'Buscar país…',
    'countrySelect.empty': 'Ningún país encontrado',
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
    ...baseEn,
    'auth.back': 'Voltar',
    'pages.register.subtitle': 'Crie a sua conta em segundos.',
    'registerForm.requiredFieldsLegend': 'Campo obrigatório',
    'registerForm.countryPlaceholder': 'Selecionar país',
    'registerForm.termsAccepted': 'Aceito os {link}',
    'registerForm.specificClausesAccepted':
      'Nos termos dos artigos 1341 e 1342 do Código Civil italiano, aprovo especificamente as cláusulas indicadas nos {link}',
    'registerForm.privacyAccepted': 'Li e aceito a {link}',
    'registerForm.termsLink': 'Termos e Condições de Serviço',
    'registerForm.privacyLink': 'Política de privacidade',
    'countrySelect.placeholder': 'Selecionar…',
    'countrySelect.searchPlaceholder': 'Pesquisar país…',
    'countrySelect.empty': 'Nenhum país encontrado',
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

function formatValue(value) {
  if (value.includes("'")) {
    return `  '${''}'`.replace("''", '') + ''; // noop fallback
  }
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
  const code = file.replace('.ts', '');
  const map = patches[code];
  if (!map) continue;

  const path = join(dir, file);
  let content = readFileSync(path, 'utf8');

  for (const [key, value] of Object.entries(map)) {
    const keyPattern = `  '${key}':`;
    const singleLine = value.includes('\n')
      ? `  '${key}':\n    '${value.replace(/'/g, "\\'")}',\n`
      : `  '${key}': '${value.replace(/'/g, "\\'")}',\n`;

    const regex = new RegExp(`  '${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':[^\\n]*,\\n`, 'm');
    const multilineRegex = new RegExp(
      `  '${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\n    '[^']*',\\n`,
      'm'
    );

    if (regex.test(content)) {
      content = content.replace(regex, singleLine);
    } else if (multilineRegex.test(content)) {
      content = content.replace(multilineRegex, singleLine);
    } else if (!content.includes(keyPattern)) {
      content = content.replace(
        "  'auth.recoverCredentials':",
        singleLine + "  'auth.recoverCredentials':"
      );
    }
  }

  writeFileSync(path, content, 'utf8');
  console.log('patched', code);
}
