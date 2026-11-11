const STORAGE_KEY = 'vocabelnCollector';

const state = {
  activeScreen: 'home',
  scanMode: 'paired',
  selectedFile: null,
  secondaryFile: null,
  selectedCollectionId: null,
  collections: [],
  reviewDraft: [],
  learningQueue: [],
  learningIndex: 0,
  learningMode: 'all',
  learningDirection: 'en-to-de',
  isCardRevealed: false,
};

const elements = {
  screens: {
    home: document.getElementById('screen-home'),
    scan: document.getElementById('screen-scan'),
    review: document.getElementById('screen-review'),
    learning: document.getElementById('screen-learning'),
    collections: document.getElementById('screen-collections'),
  },
  collectionSelector: document.getElementById('collectionSelector'),
  newCollectionBtn: document.getElementById('newCollectionBtn'),
  openScanBtn: document.getElementById('openScanBtn'),
  backHomeBtn: document.getElementById('backHomeBtn'),
  fileInput: document.getElementById('fileInput'),
  secondaryFileInput: document.getElementById('secondaryFileInput'),
  cameraInput: document.getElementById('cameraInput'),
  captureBtn: document.getElementById('captureBtn'),
  primaryUploadText: document.getElementById('primaryUploadText'),
  secondaryUploadText: document.getElementById('secondaryUploadText'),
  secondaryUploadSection: document.getElementById('secondaryUploadSection'),
  previewImage: document.getElementById('scanPreview'),
  canvas: document.getElementById('scanCanvas'),
  ocrStatus: document.getElementById('ocrStatus'),
  runScanBtn: document.getElementById('runScanBtn'),
  scanModes: [...document.querySelectorAll('.scan-mode')],
  reviewTableBody: document.getElementById('reviewTableBody'),
  applyWordsBtn: document.getElementById('applyWordsBtn'),
  editScanAgainBtn: document.getElementById('editScanAgainBtn'),
  learningTitle: document.getElementById('learningTitle'),
  progressText: document.getElementById('progressText'),
  progressPercent: document.getElementById('progressPercent'),
  progressSummary: document.getElementById('progressSummary'),
  progressFill: document.getElementById('learningProgressFill'),
  wordMain: document.getElementById('wordMain'),
  wordAnswer: document.getElementById('wordAnswer'),
  revealBtn: document.getElementById('revealBtn'),
  wordCard: document.getElementById('wordCard'),
  speakerBtn: document.getElementById('speakerBtn'),
  cardFlag: document.getElementById('cardFlag'),
  learningButtons: document.getElementById('learningButtons'),
  knownBtn: document.getElementById('knownBtn'),
  retryBtn: document.getElementById('retryBtn'),
  repeatAllBtn: document.getElementById('repeatAllBtn'),
  difficultOnlyBtn: document.getElementById('difficultOnlyBtn'),
  reverseBtn: document.getElementById('reverseBtn'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  collectionsList: document.getElementById('collectionsList'),
  collectionsNewBtn: document.getElementById('collectionsNewBtn'),
  homeTotalWords: document.getElementById('homeTotalWords'),
  homeMasteredWords: document.getElementById('homeMasteredWords'),
  homePendingWords: document.getElementById('homePendingWords'),
  nameModal: document.getElementById('nameModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalInput: document.getElementById('modalInput'),
  modalCancelBtn: document.getElementById('modalCancelBtn'),
  modalConfirmBtn: document.getElementById('modalConfirmBtn'),
};

function createDemoCollection() {
  state.collections = [];
  state.selectedCollectionId = null;
  saveCollections();
}

function loadCollections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      createDemoCollection();
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      createDemoCollection();
      return;
    }

    state.collections = parsed;
    state.selectedCollectionId = parsed.find((collection) => collection.id === state.selectedCollectionId)
      ? state.selectedCollectionId
      : (parsed[0] ? parsed[0].id : null);
    saveCollections();
  } catch (error) {
    console.error('Unable to load collections:', error);
    createDemoCollection();
  }
}

function saveCollections() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.collections));
}

function normalizeWord(value) {
  return (value || '')
    .replace(/\s+/g, ' ')
    .replace(/[\u2019']/g, "'")
    .replace(/[^\p{L}\p{N}\s'-]/gu, '')
    .trim();
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function humanReadableMode(mode) {
  if (mode === 'paired') return 'Deutsch + Englisch';
  if (mode === 'german') return 'Nur Deutsch';
  return 'Nur Englisch';
}

function openScreen(name) {
  state.activeScreen = name;
  Object.entries(elements.screens).forEach(([screenName, element]) => {
    element.classList.toggle('active', screenName === name);
  });
}

function getActiveCollection() {
  return state.collections.find((collection) => collection.id === state.selectedCollectionId) || null;
}

function getCollectionStats(collection) {
  const total = collection.items.length;
  const mastered = collection.items.filter((item) => (item.correct || 0) >= 3).length;
  const pending = total - mastered;
  const wrong = collection.items.filter((item) => (item.mistakes || 0) > 0).length;
  return { total, mastered, pending, wrong };
}

function renderCollectionSelector() {
  const current = getActiveCollection();
  const options = state.collections
    .map(
      (collection) =>
        `<option value="${collection.id}" ${collection.id === (current ? current.id : '') ? 'selected' : ''}>${collection.name}</option>`
    )
    .join('');

  elements.collectionSelector.innerHTML = options || '<option>Keine Sammlung</option>';
  if (!state.collections.length) {
    elements.collectionSelector.disabled = true;
    return;
  }

  elements.collectionSelector.disabled = false;
}

function renderHomeStats() {
  const collection = getActiveCollection();
  if (!collection) {
    elements.homeTotalWords.textContent = '0';
    elements.homeMasteredWords.textContent = '0';
    elements.homePendingWords.textContent = '0';
    return;
  }

  const stats = getCollectionStats(collection);
  elements.homeTotalWords.textContent = stats.total;
  elements.homeMasteredWords.textContent = stats.mastered;
  elements.homePendingWords.textContent = stats.pending;
}

function renderCollections() {
  if (!state.collections.length) {
    elements.collectionsList.innerHTML = '<p>Keine Sammlungen vorhanden.</p>';
    return;
  }

  elements.collectionsList.innerHTML = state.collections
    .map((collection) => {
      const stats = getCollectionStats(collection);
      return `
        <div class="collection-item">
          <div class="collection-header">
            <div class="collection-name">${collection.name}</div>
            <span class="status-pill safe">${stats.total} Wörter</span>
          </div>
          <div class="collection-actions">
            <button class="secondary-btn" data-action="open" data-id="${collection.id}">Öffnen</button>
            <button class="ghost-btn" data-action="rename" data-id="${collection.id}">Umbenennen</button>
            <button class="table-btn" data-action="delete" data-id="${collection.id}">Löschen</button>
          </div>
        </div>
      `;
    })
    .join('');
}

function setStatus(message, isWarning = false) {
  elements.ocrStatus.textContent = message;
  elements.ocrStatus.style.background = isWarning ? 'rgba(247,167,45,0.12)' : 'rgba(224, 244, 233, 0.8)';
  elements.ocrStatus.style.color = isWarning ? '#8f5d00' : '#0f6a4d';
}

function selectMode(mode) {
  state.scanMode = mode;
  const isSingleLanguage = mode !== 'paired';
  elements.secondaryUploadSection.classList.toggle('hidden', !isSingleLanguage);
  elements.secondaryUploadText.textContent = mode === 'german' ? 'Englisch-Bild ergänzen' : 'Deutsch-Bild ergänzen';
  elements.primaryUploadText.textContent = mode === 'german' ? 'Deutsches Bild hochladen' : mode === 'english' ? 'Englisches Bild hochladen' : 'Bild oder PDF hochladen';

  elements.scanModes.forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === mode);
  });
}

function handleFileSelection(file, isSecondary = false) {
  if (!file) return;

  if (isSecondary) {
    state.secondaryFile = file;
    return;
  }

  state.selectedFile = file;
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    renderPdfPreview(file);
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    elements.previewImage.src = event.target.result;
    elements.previewImage.hidden = false;
    elements.canvas.hidden = true;
  };
  reader.readAsDataURL(file);
}

async function renderPdfPreview(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = window.pdfjsLib;

  if (!pdfjsLib) {
    setStatus('PDF-Rendering ist derzeit nicht verfügbar.', true);
    return;
  }

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.2 });
  const canvas = elements.canvas;
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;
  elements.canvas.hidden = false;
  elements.previewImage.hidden = true;
  elements.previewImage.removeAttribute('src');
}

async function ocrFile(file, languageMode = state.scanMode) {
  const targetLanguage = languageMode === 'german' ? 'deu' : languageMode === 'english' ? 'eng' : 'deu+eng';
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    const canvas = elements.canvas;
    const dataUrl = canvas.toDataURL('image/png');
    const result = await Tesseract.recognize(dataUrl, targetLanguage, {
      logger: (message) => {
        if (message.status === 'recognizing text') {
          setStatus(`OCR läuft... ${Math.round((message.progress || 0) * 100)}%`);
        }
      },
    });
    return result.data.text;
  }

  const result = await Tesseract.recognize(file, targetLanguage, {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        setStatus(`OCR läuft... ${Math.round((message.progress || 0) * 100)}%`);
      }
    },
  });
  return result.data.text;
}

function looksLikeSentenceText(value) {
  const normalized = normalizeWord(value || '');
  if (!normalized) return false;

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length > 6) return true;
  if (/[.!?]/.test(normalized)) return true;

  const sentenceWords = /\b(the|and|when|what|this|that|they|she|he|it|was|were|is|are|of|to|in|on|for|with|from|by|i|we|you|me|him|her|them|a|an)\b/i;
  if (sentenceWords.test(normalized) && words.length > 2) return true;

  return false;
}

function validateGrammarPair(deValue, enValue) {
  const de = normalizeWord(deValue || '');
  const en = normalizeWord(enValue || '');

  if (!de || !en) return false;
  if (de === en) return false;
  if (/[.!?,;:]/.test(de) || /[.!?,;:]/.test(en)) return false;

  const deWords = de.split(/\s+/).filter(Boolean);
  const enWords = en.split(/\s+/).filter(Boolean);

  if (deWords.length > 3 || enWords.length > 3) return false;

  const sentenceTriggers = new Set([
    'what', 'when', 'where', 'why', 'who', 'how', 'this', 'that', 'these', 'those',
    'they', 'he', 'she', 'it', 'we', 'i', 'you', 'were', 'was', 'is', 'are', 'am', 'have', 'has',
    'had', 'do', 'does', 'did', 'not', 'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then'
  ]);

  const germanTriggers = new Set([
    'der', 'die', 'das', 'und', 'oder', 'aber', 'wenn', 'dass', 'ich', 'du', 'er', 'sie', 'wir', 'ihr', 'das', 'mit', 'auf', 'im', 'am', 'bei'
  ]);

  if (enWords.some((word) => sentenceTriggers.has(word.toLowerCase())) && enWords.length > 1) return false;
  if (deWords.some((word) => germanTriggers.has(word.toLowerCase())) && deWords.length > 1) return false;

  return true;
}

function parseRecognizedText(text, mode) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items = [];

  for (const line of lines) {
    const cleaned = line.replace(/[^\p{L}\p{N}\s|\t\-']/gu, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;

    const lowerLine = cleaned.toLowerCase();
    if (lowerLine === 'deutsch' || lowerLine === 'english' || lowerLine === 'deutsch | englisch' || lowerLine === 'englisch | deutsch') {
      continue;
    }

    const splitByPipe = cleaned.split('|').map((part) => part.trim()).filter(Boolean);
    if (splitByPipe.length >= 3) {
      const left = normalizeWord(splitByPipe[0]);
      const right = normalizeWord(splitByPipe[splitByPipe.length - 1]);
      if (left && right && !looksLikeSentenceText(splitByPipe[1])) {
        items.push({ de: left, en: right, uncertain: false });
      }
      continue;
    }

    const byTabs = cleaned.split(/\t+/).map((part) => normalizeWord(part)).filter(Boolean);
    if (byTabs.length >= 3) {
      const left = byTabs[0];
      const right = byTabs[byTabs.length - 1];
      if (left && right && !looksLikeSentenceText(byTabs[1] || '')) {
        items.push({ de: left, en: right, uncertain: false });
      }
      continue;
    }

    const tokens = cleaned.match(/[\p{L}\p{N}'-]+/gu) || [];
    if (tokens.length >= 2) {
      const words = tokens.map((token) => normalizeWord(token)).filter(Boolean);
      if (words.length === 2 && !looksLikeSentenceText(cleaned)) {
        const [de, en] = words;
        items.push({ de, en, uncertain: false });
        continue;
      }
    }

    if (mode === 'paired') {
      const parts = cleaned.split(/\s{2,}/).map((part) => normalizeWord(part)).filter(Boolean);
      if (parts.length >= 2) {
        const left = parts[0];
        const right = parts[parts.length - 1];
        if (left && right && !looksLikeSentenceText(parts.slice(1).join(' '))) {
          items.push({ de: left, en: right, uncertain: true });
        }
      }
    }

    if (mode !== 'paired') {
      const word = normalizeWord(cleaned);
      if (word && !looksLikeSentenceText(cleaned)) {
        const targetKey = mode === 'german' ? 'de' : 'en';
        items.push({ de: '', en: '', uncertain: false, [targetKey]: word });
      }
    }
  }

  const deduped = [];
  const seen = new Set();
  for (const item of items) {
    const key = `${item.de || ''}|${item.en || ''}`.toLowerCase();
    if (key && !seen.has(key)) {
      deduped.push(item);
      seen.add(key);
    }
  }

  return deduped;
}

function renderReviewTable() {
  if (!state.reviewDraft.length) {
    elements.reviewTableBody.innerHTML = '<tr><td colspan="4">Keine Einträge verfügbar.</td></tr>';
    return;
  }

  elements.reviewTableBody.innerHTML = state.reviewDraft
    .map(
      (item, index) => `
        <tr data-index="${index}">
          <td>
            <input class="table-input" data-field="de" data-index="${index}" value="${escapeHtml(item.de || '')}" />
          </td>
          <td>
            <input class="table-input" data-field="en" data-index="${index}" value="${escapeHtml(item.en || '')}" />
          </td>
          <td>
            <span class="status-pill ${item.uncertain ? 'warning' : 'safe'}">
              ${item.uncertain ? 'Prüfen' : 'OK'}
            </span>
          </td>
          <td>
            <button class="table-btn" data-action="remove-review" data-index="${index}">Entfernen</button>
          </td>
        </tr>
      `
    )
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function lookupDictionaryWord(word, lang) {
  const cleanWord = normalizeWord(word);
  if (!cleanWord) return null;

  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/${lang}/${encodeURIComponent(cleanWord)}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || !data.length) return null;

    return cleanWord;
  } catch (error) {
    return null;
  }
}

async function correctWordByDictionary(word, lang) {
  const normalized = normalizeWord(word);
  if (!normalized) return '';

  const known = await lookupDictionaryWord(normalized, lang);
  if (known) return known;

  const targetLang = lang === 'de' ? 'en' : 'de';
  const translated = await translateWordList([normalized], lang, targetLang);
  if (translated && translated[0]) {
    const corrected = normalizeWord(translated[0]);
    if (corrected) return corrected;
  }

  return normalized;
}

async function validateAgainstDictionary(words, lang) {
  const result = [];

  for (const word of words) {
    const normalized = normalizeWord(word);
    if (!normalized) continue;

    const corrected = await correctWordByDictionary(normalized, lang);
    result.push({ original: normalized, corrected, valid: corrected === normalized || Boolean(await lookupDictionaryWord(normalized, lang)) });
  }

  return result;
}

async function translateWordList(words, sourceLang, targetLang) {
  const uniqueWords = [...new Set(words.map((word) => normalizeWord(word)).filter(Boolean))];
  if (!uniqueWords.length) return [];

  const endpoints = [
    'https://translate.argosopentech.com/translate',
    'https://libretranslate.de/translate',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: uniqueWords,
          source: sourceLang,
          target: targetLang,
          format: 'text',
        }),
      });

      if (!response.ok) continue;
      const data = await response.json();

      if (Array.isArray(data)) {
        const translated = data.map((entry) => normalizeWord(entry?.translatedText || entry?.text || ''));
        if (translated.length === uniqueWords.length) {
          const map = new Map(uniqueWords.map((word, index) => [word, translated[index]]));
          return words.map((word) => map.get(normalizeWord(word)) || '');
        }
      }

      if (Array.isArray(data?.translations)) {
        const translated = data.translations.map((entry) => normalizeWord(entry?.translatedText || ''));
        if (translated.length === uniqueWords.length) {
          const map = new Map(uniqueWords.map((word, index) => [word, translated[index]]));
          return words.map((word) => map.get(normalizeWord(word)) || '');
        }
      }
    } catch (error) {
      console.warn('Translation endpoint failed:', endpoint, error);
    }
  }

  return null;
}

async function buildPairedList(primaryWords, secondaryWords, primaryLang, secondaryLang) {
  const pairs = [];
  const maxLength = Math.max(primaryWords.length, secondaryWords.length);

  for (let index = 0; index < maxLength; index += 1) {
    const primaryValue = primaryWords[index] || '';
    const secondaryValue = secondaryWords[index] || '';
    const de = primaryLang === 'de' ? primaryValue : secondaryValue;
    const en = primaryLang === 'en' ? primaryValue : secondaryValue;

    if (de || en) {
      const normalizedDe = normalizeWord(de);
      const normalizedEn = normalizeWord(en);
      const correctedDe = normalizedDe ? await correctWordByDictionary(normalizedDe, 'de') : '';
      const correctedEn = normalizedEn ? await correctWordByDictionary(normalizedEn, 'en') : '';

      pairs.push({
        de: primaryLang === 'de' ? correctedDe : correctedEn,
        en: primaryLang === 'en' ? correctedEn : correctedDe,
        uncertain: !validateGrammarPair(primaryLang === 'de' ? correctedDe : correctedEn, primaryLang === 'en' ? correctedEn : correctedDe),
      });
    }
  }

  return pairs.filter((item) => item.de || item.en);
}

async function handleScan() {
  if (!state.selectedFile) {
    setStatus('Bitte lade zuerst ein Bild oder PDF hoch.', true);
    return;
  }

  setStatus('Texterkennung läuft...');

  try {
    if (state.scanMode === 'paired') {
      const text = await ocrFile(state.selectedFile);
      const parsed = parseRecognizedText(text, state.scanMode);

      if (!parsed.length) {
        setStatus('Es konnten keine passenden Vokabeln erkannt werden. Bitte prüfe das Bild oder scanne erneut.', true);
        return;
      }

      state.reviewDraft = parsed
        .filter((item) => item.de || item.en)
        .map((item) => ({
          ...item,
          uncertain: !validateGrammarPair(item.de, item.en),
        }));
    } else {
      if (!state.secondaryFile) {
        setStatus('Bitte lade zusätzlich das zweite Bild mit der anderen Sprache hoch.', true);
        return;
      }

      const primaryLanguage = state.scanMode === 'german' ? 'de' : 'en';
      const secondaryLanguage = primaryLanguage === 'de' ? 'en' : 'de';

      const primaryText = await ocrFile(state.selectedFile, state.scanMode);
      const secondaryText = await ocrFile(state.secondaryFile, primaryLanguage === 'de' ? 'english' : 'german');

      const primaryParsed = parseRecognizedText(primaryText, state.scanMode);
      const secondaryParsed = parseRecognizedText(secondaryText, primaryLanguage === 'de' ? 'english' : 'german');

      const primaryWords = primaryParsed.map((item) => (primaryLanguage === 'de' ? item.de : item.en)).filter(Boolean);
      const secondaryWords = secondaryParsed.map((item) => (secondaryLanguage === 'de' ? item.de : item.en)).filter(Boolean);

      state.reviewDraft = await buildPairedList(primaryWords, secondaryWords, primaryLanguage, secondaryLanguage);

      if (!state.reviewDraft.length) {
        setStatus('Es konnten keine passenden Vokabeln zwischen den beiden Bildern erkannt werden.', true);
        return;
      }
    }

    const invalidPairs = state.reviewDraft.filter((item) => item.uncertain).length;
    if (invalidPairs > 0) {
      setStatus(`${invalidPairs} Einträge wurden als grammatisch unsicher erkannt und müssen geprüft werden.`);
    }

    renderReviewTable();
    openScreen('review');
    setStatus(`Erfolgreich ${state.reviewDraft.length} Einträge erkannt.`);
  } catch (error) {
    console.error(error);
    setStatus('Beim OCR-Scan ist ein Fehler aufgetreten.', true);
  }
}

function ensureCollectionName() {
  const currentCollection = getActiveCollection();
  if (currentCollection) {
    return currentCollection.name;
  }

  return 'Englisch Sammlung';
}

function openNameModal({ title, defaultValue, onConfirm }) {
  elements.modalTitle.textContent = title;
  elements.modalInput.value = defaultValue || '';
  elements.modalInput.focus();
  elements.modalInput.select();
  elements.nameModal.classList.remove('hidden');
  elements.nameModal.setAttribute('aria-hidden', 'false');

  const handler = () => {
    const value = elements.modalInput.value.trim();
    elements.nameModal.classList.add('hidden');
    elements.nameModal.setAttribute('aria-hidden', 'true');
    elements.modalConfirmBtn.onclick = null;
    elements.modalCancelBtn.onclick = null;
    elements.modalInput.onkeydown = null;
    onConfirm(value || defaultValue || 'Neue Sammlung');
  };

  elements.modalConfirmBtn.onclick = handler;
  elements.modalCancelBtn.onclick = () => {
    elements.nameModal.classList.add('hidden');
    elements.nameModal.setAttribute('aria-hidden', 'true');
    elements.modalConfirmBtn.onclick = null;
    elements.modalCancelBtn.onclick = null;
    elements.modalInput.onkeydown = null;
  };
  elements.modalInput.onkeydown = (event) => {
    if (event.key === 'Enter') {
      handler();
    }
    if (event.key === 'Escape') {
      elements.modalCancelBtn.click();
    }
  };
}

function createOrUpdateCollectionFromReview() {
  if (!state.reviewDraft.length) {
    setStatus('Keine gültigen Vokabeln zum Übernehmen vorhanden.', true);
    return;
  }

  const cleaned = state.reviewDraft
    .map((item) => {
      const de = normalizeWord(item.de || '');
      const en = normalizeWord(item.en || '');
      return {
        id: crypto.randomUUID(),
        de,
        en,
        correct: 0,
        mistakes: 0,
        uncertain: !!item.uncertain,
      };
    })
    .filter((item) => item.de || item.en);

  if (!cleaned.length) {
    setStatus('Die Vokabeln sind leer oder ungültig.', true);
    return;
  }

  openNameModal({
    title: 'Sammlung benennen',
    defaultValue: ensureCollectionName(),
    onConfirm: (targetName) => {
      const trimmedName = targetName.trim() || 'Neue Sammlung';

      let targetCollection = state.collections.find((collection) => collection.id === state.selectedCollectionId);
      if (!targetCollection) {
        targetCollection = {
          id: crypto.randomUUID(),
          name: trimmedName,
          items: [],
        };
        state.collections.push(targetCollection);
        state.selectedCollectionId = targetCollection.id;
      } else {
        targetCollection.name = trimmedName;
      }

      const existingByKey = new Map(targetCollection.items.map((item) => [`${item.de.toLowerCase()}|${item.en.toLowerCase()}`, item]));

      for (const item of cleaned) {
        const key = `${(item.de || '').toLowerCase()}|${(item.en || '').toLowerCase()}`;
        if (!existingByKey.has(key)) {
          targetCollection.items.push({
            ...item,
            de: item.de || '',
            en: item.en || '',
          });
        }
      }

      saveCollections();
      renderCollectionSelector();
      renderHomeStats();
      renderCollections();
      openScreen('learning');
      startLearning();
    },
  });
}

function buildDeck({ difficultOnly = false, reverseDirection = false } = {}) {
  if (!state.collections.length) {
    return [];
  }

  const collection = getActiveCollection();
  if (!collection || !collection.items.length) {
    return [];
  }

  let items = collection.items.filter((item) => (item.de || item.en) && (item.de && item.en));
  if (!items.length) {
    return [];
  }

  if (difficultOnly) {
    items = items.filter((item) => (item.mistakes || 0) > 0 || (item.correct || 0) < 2);
  }

  const weighted = [];
  for (const item of items) {
    const repeats = Math.max(1, Math.min(5, (item.mistakes || 0) + 1 + (item.correct || 0) * 0.5));
    for (let i = 0; i < repeats; i += 1) {
      weighted.push({
        ...item,
        displayDe: reverseDirection ? item.en : item.de,
        displayEn: reverseDirection ? item.de : item.en,
        reverseDirection,
      });
    }
  }

  return shuffle(weighted);
}

function renderLearningCard() {
  const collection = getActiveCollection();
  if (!collection) {
    setStatus('Es gibt noch keine Sammlung zum Lernen.', true);
    return;
  }

  if (!state.learningQueue.length) {
    state.learningQueue = buildDeck({ difficultOnly: state.learningMode === 'difficult', reverseDirection: state.learningDirection === 'de-to-en' });
  }

  if (!state.learningQueue.length) {
    setStatus('Keine Vokabeln in dieser Runde verfügbar.', true);
    return;
  }

  const card = state.learningQueue[state.learningIndex] || state.learningQueue[0];
  const directionLabel = state.learningDirection === 'de-to-en' ? 'Deutsch → Englisch' : 'Englisch → Deutsch';
  const showGerman = state.learningDirection === 'en-to-de';

  if (!card) {
    return;
  }

  elements.learningTitle.textContent = `${collection.name} · ${directionLabel}`;
  elements.cardFlag.textContent = showGerman ? 'Englisch' : 'Deutsch';
  elements.wordMain.textContent = showGerman ? card.en : card.de;
  elements.wordAnswer.textContent = showGerman ? `Deutsch: ${card.de}` : `Englisch: ${card.en}`;
  elements.wordAnswer.classList.toggle('hidden', !state.isCardRevealed);
  elements.learningButtons.classList.toggle('hidden', !state.isCardRevealed);

  const total = collection.items.length;
  const currentSlot = state.learningIndex + 1;
  const percent = total ? Math.min(100, Math.round((currentSlot / Math.max(1, total)) * 100)) : 0;

  const stats = getCollectionStats(collection);
  const correct = stats.mastered;
  const pending = stats.pending;

  elements.progressText.textContent = `Vokabel ${Math.min(currentSlot, total || 1)} von ${total || 0}`;
  elements.progressPercent.textContent = `${percent}% geschafft`;
  elements.progressSummary.textContent = `${correct} richtig · ${pending} zu üben`;
  elements.progressFill.style.width = `${percent}%`;
}

function speakEnglishWord(word) {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((voice) => /en-US|en-GB/i.test(voice.lang)) || voices.find((voice) => voice.lang.startsWith('en'));
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function startLearning({ forceReset = false } = {}) {
  const collection = getActiveCollection();
  if (!collection) {
    return;
  }

  if (forceReset || !state.learningQueue.length) {
    state.learningQueue = buildDeck({
      difficultOnly: state.learningMode === 'difficult',
      reverseDirection: state.learningDirection === 'de-to-en',
    });
    state.learningIndex = 0;
  }

  state.isCardRevealed = false;
  renderLearningCard();
  openScreen('learning');
}

function updateCollectionItem(itemId, deltaCorrect, deltaMistakes) {
  const collection = getActiveCollection();
  if (!collection) return;

  const item = collection.items.find((entry) => entry.id === itemId);
  if (!item) return;

  item.correct = Math.max(0, (item.correct || 0) + deltaCorrect);
  item.mistakes = Math.max(0, (item.mistakes || 0) + deltaMistakes);
  saveCollections();
  renderHomeStats();
  renderCollections();
}

function advanceLearningCard() {
  if (!state.learningQueue.length) {
    return;
  }

  state.learningIndex += 1;
  if (state.learningIndex >= state.learningQueue.length) {
    const collection = getActiveCollection();
    state.learningQueue = buildDeck({ difficultOnly: state.learningMode === 'difficult', reverseDirection: state.learningDirection === 'de-to-en' });
    state.learningIndex = 0;
    if (!state.learningQueue.length) {
      openScreen('collections');
      return;
    }
    if (collection) {
      const stats = getCollectionStats(collection);
      const total = stats.total;
      const correct = stats.mastered;
      const summary = `Super gemacht! Du hast ${total} Vokabeln gelernt.\n- ${correct} richtig\n- ${stats.pending} noch zu üben`;
      alert(summary);
    }
  }

  state.isCardRevealed = false;
  renderLearningCard();
}

function revealCurrentWord() {
  state.isCardRevealed = true;
  const card = state.learningQueue[state.learningIndex];
  if (card) {
    const compareWord = state.learningDirection === 'en-to-de' ? card.en : card.de;
    elements.wordAnswer.classList.remove('hidden');
    elements.learningButtons.classList.remove('hidden');
    speakEnglishWord(compareWord);
  }
  renderLearningCard();
}

function handleKnownAnswer() {
  const card = state.learningQueue[state.learningIndex];
  if (!card) return;

  updateCollectionItem(card.id, 1, -1);
  advanceLearningCard();
}

function handleRetryAnswer() {
  const card = state.learningQueue[state.learningIndex];
  if (!card) return;

  updateCollectionItem(card.id, 0, 1);
  advanceLearningCard();
}

function onCollectionSelection() {
  state.selectedCollectionId = elements.collectionSelector.value;
  renderHomeStats();
  if (state.activeScreen === 'learning') {
    startLearning({ forceReset: true });
  }
}

function addCollection() {
  openNameModal({
    title: 'Neue Sammlung',
    defaultValue: `Englisch ${state.collections.length + 1}`,
    onConfirm: (name) => {
      const trimmed = name.trim() || `Englisch ${state.collections.length + 1}`;
      const newCollection = {
        id: crypto.randomUUID(),
        name: trimmed,
        items: [],
      };
      state.collections.push(newCollection);
      state.selectedCollectionId = newCollection.id;
      saveCollections();
      renderCollectionSelector();
      renderHomeStats();
      renderCollections();
      openScreen('collections');
    },
  });
}

function renameCollection(collectionId) {
  const collection = state.collections.find((entry) => entry.id === collectionId);
  if (!collection) return;

  openNameModal({
    title: 'Sammlung umbennen',
    defaultValue: collection.name,
    onConfirm: (newName) => {
      collection.name = newName.trim() || collection.name;
      saveCollections();
      renderCollectionSelector();
      renderCollections();
      renderLearningCard();
    },
  });
}

function deleteCollection(collectionId) {
  if (!confirm('Sammlung wirklich löschen?')) return;

  state.collections = state.collections.filter((entry) => entry.id !== collectionId);
  if (!state.collections.length) {
    state.selectedCollectionId = null;
    saveCollections();
    renderCollectionSelector();
    renderHomeStats();
    renderCollections();
    return;
  }

  state.selectedCollectionId = state.collections[0].id;
  saveCollections();
  renderCollectionSelector();
  renderHomeStats();
  renderCollections();
}

function setLearningMode(mode) {
  state.learningMode = mode;
  startLearning({ forceReset: true });
}

function toggleDirection() {
  state.learningDirection = state.learningDirection === 'en-to-de' ? 'de-to-en' : 'en-to-de';
  startLearning({ forceReset: true });
}

function shuffleCurrentQueue() {
  state.learningQueue = shuffle(state.learningQueue);
  state.learningIndex = 0;
  state.isCardRevealed = false;
  renderLearningCard();
}

function attachEvents() {
  elements.openScanBtn.addEventListener('click', () => openScreen('scan'));
  elements.backHomeBtn.addEventListener('click', () => openScreen('home'));
  elements.fileInput.addEventListener('change', (event) => handleFileSelection(event.target.files[0]));
  elements.secondaryFileInput.addEventListener('change', (event) => handleFileSelection(event.target.files[0], true));
  elements.cameraInput.addEventListener('change', (event) => handleFileSelection(event.target.files[0]));
  elements.captureBtn.addEventListener('click', () => elements.cameraInput.click());
  elements.runScanBtn.addEventListener('click', handleScan);
  elements.applyWordsBtn.addEventListener('click', createOrUpdateCollectionFromReview);
  elements.editScanAgainBtn.addEventListener('click', () => openScreen('scan'));
  elements.collectionSelector.addEventListener('change', onCollectionSelection);
  elements.newCollectionBtn.addEventListener('click', addCollection);
  elements.collectionsNewBtn.addEventListener('click', addCollection);
  elements.revealBtn.addEventListener('click', revealCurrentWord);
  elements.speakerBtn.addEventListener('click', () => {
    const card = state.learningQueue[state.learningIndex];
    if (!card) return;
    const word = state.learningDirection === 'en-to-de' ? card.en : card.de;
    speakEnglishWord(word);
  });
  elements.knownBtn.addEventListener('click', handleKnownAnswer);
  elements.retryBtn.addEventListener('click', handleRetryAnswer);
  elements.repeatAllBtn.addEventListener('click', () => startLearning({ forceReset: true }));
  elements.difficultOnlyBtn.addEventListener('click', () => setLearningMode(state.learningMode === 'difficult' ? 'all' : 'difficult'));
  elements.reverseBtn.addEventListener('click', toggleDirection);
  elements.shuffleBtn.addEventListener('click', shuffleCurrentQueue);
  elements.scanModes.forEach((button) => button.addEventListener('click', () => selectMode(button.dataset.mode)));

  elements.reviewTableBody.addEventListener('input', (event) => {
    const field = event.target.dataset.field;
    const index = Number(event.target.dataset.index);
    if (!field || Number.isNaN(index)) return;
    const target = state.reviewDraft[index];
    if (!target) return;
    target[field] = event.target.value;
  });

  elements.reviewTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="remove-review"]');
    if (!button) return;
    const index = Number(button.dataset.index);
    state.reviewDraft.splice(index, 1);
    renderReviewTable();
  });

  elements.collectionsList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'open') {
      state.selectedCollectionId = id;
      renderCollectionSelector();
      renderHomeStats();
      startLearning({ forceReset: true });
    }
    if (action === 'rename') {
      renameCollection(id);
    }
    if (action === 'delete') {
      deleteCollection(id);
    }
  });

  window.speechSynthesis.onvoiceschanged = () => {
    if (state.learningQueue.length) {
      speakEnglishWord(state.learningQueue[state.learningIndex].en);
    }
  };
}

function init() {
  loadCollections();
  selectMode('paired');
  renderCollectionSelector();
  renderHomeStats();
  renderCollections();
  attachEvents();
  openScreen('home');
  setStatus('Bereit für den Scan.');
}

init();
