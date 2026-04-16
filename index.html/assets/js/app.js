import { formatDuration, formatPrice, sumBy, badgeClass } from './utils.js';
import { pickRecommendedCourses, pickRecommendedOptions } from './recommendation.js';
import { APP_CONFIG } from './config.js';

const AGE_GROUPS = [
  { id: 'u19', label: '〜19', age: 19 },
  { id: '20s', label: '20〜29', age: 25 },
  { id: '30s', label: '30〜39', age: 35 },
  { id: '40s', label: '40〜49', age: 45 },
  { id: '50s', label: '50〜59', age: 55 },
  { id: '60plus', label: '60〜', age: 65 },
];

const STEPS = ['intro', 'gender', 'age', 'symptoms', 'courses', 'duration', 'combination', 'options', 'confirm'];
const BADGE_ORDER = { NEW: 1, '人気No.1': 2, 'リピNo.1': 3, 'おすすめ': 4, '限定': 5 };

const state = {
  step: 'intro',
  symptoms: [],
  user: {
    gender: null,
    age: 35,
    ageGroup: '30s',
    ageLabel: '30〜39',
  },
  selectedCourseBases: [],
  selectedCourses: [],
  selectedOptions: [],
  data: {
    symptoms: [],
    courses: [],
    options: [],
    messages: null,
  },
};

const elements = {
  introCard: document.getElementById('introCard'),
  introMessage: document.getElementById('introMessage'),
  wizardSection: document.getElementById('wizardSection'),
  stepMessage: document.getElementById('stepMessage'),
  stepPanel: document.getElementById('stepPanel'),
  startButton: document.getElementById('startButton'),
  backButton: document.getElementById('backButton'),
  resetButtonTop: document.getElementById('resetButtonTop'),
  resetButtonBottom: document.getElementById('resetButtonBottom'),
  totalDuration: document.getElementById('totalDuration'),
  totalPrice: document.getElementById('totalPrice'),
  selectionSummary: document.getElementById('selectionSummary'),
  choiceCardTemplate: document.getElementById('choiceCardTemplate'),
};

async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

async function bootstrap() {
  const [symptoms, courses, options, messages] = await Promise.all([
    loadJSON('./data/symptoms.json'),
    loadJSON('./data/courses.json'),
    loadJSON('./data/options.json'),
    loadJSON('./data/scenario_messages.json'),
  ]);

  state.data = {
    symptoms: symptoms.symptoms || [],
    courses: courses.courses || [],
    options: options.options || [],
    messages,
  };

  bindEvents();
  renderIntro();
  updateSummary();
}

function bindEvents() {
  elements.startButton.addEventListener('click', () => goToStep('gender'));
  elements.backButton.addEventListener('click', goBack);
  elements.resetButtonTop.addEventListener('click', resetAll);
  elements.resetButtonBottom.addEventListener('click', resetAll);
}

function goBack() {
  const index = STEPS.indexOf(state.step);
  if (index <= 1) {
    resetAll();
    return;
  }

  if (state.step === 'courses') {
    state.selectedCourseBases = [];
    state.selectedCourses = [];
    state.selectedOptions = [];
  }

  if (state.step === 'symptoms') {
    state.selectedCourseBases = [];
    state.selectedCourses = [];
    state.selectedOptions = [];
  }

  goToStep(STEPS[index - 1]);
}

function resetAll() {
  state.step = 'intro';
  state.symptoms = [];
  state.user = {
    gender: null,
    age: 35,
    ageGroup: '30s',
    ageLabel: '30〜39',
  };
  state.selectedCourseBases = [];
  state.selectedCourses = [];
  state.selectedOptions = [];
  renderIntro();
  updateSummary();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function goToStep(step) {
  state.step = step;
  elements.introCard.classList.toggle('hidden', step !== 'intro');
  elements.wizardSection.classList.toggle('hidden', step === 'intro');

  if (step === 'intro') {
    renderIntro();
    updateSummary();
    return;
  }

  renderStep();
  updateSummary();
  scrollToWizardTop();
}

function scrollToWizardTop() {
  requestAnimationFrame(() => {
    const top = elements.wizardSection.getBoundingClientRect().top + window.scrollY - 8;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  });
}

function renderIntro() {
  const messages = state.data.messages?.messages;
  if (!messages) return;
  elements.introCard.classList.remove('hidden');
  elements.wizardSection.classList.add('hidden');
  elements.introMessage.innerHTML = messages.start.map(line => `<p>${line}</p>`).join('');
}

function renderStep() {
  const messages = state.data.messages?.messages || {};
  elements.stepPanel.innerHTML = '';

  if (state.step === 'gender') {
    elements.stepMessage.innerHTML = `<p>${messages.genderPrompt || 'まずは性別をお選びください。'}</p>`;
    renderGender();
    return;
  }

  if (state.step === 'age') {
    elements.stepMessage.innerHTML = `<p>${messages.agePrompt || '続いて年代をお選びください。年代に合わせてコースの並び順を整えます。'}</p>`;
    renderAge();
    return;
  }

  if (state.step === 'symptoms') {
    elements.stepMessage.innerHTML = (messages.symptomPrompt || ['今のお悩みや症状に近いものを選んでください。'])
      .map(line => `<p>${line}</p>`)
      .join('');
    renderSymptoms();
    return;
  }

  if (state.step === 'courses') {
    elements.stepMessage.innerHTML = `<p>${buildEmpathyMessage()}</p><p>${messages.coursePrompt || '相性のよいコースから順番にご紹介します。最大2つまで選べます。'}</p>`;
    renderCourses();
    return;
  }

  if (state.step === 'duration') {
    elements.stepMessage.innerHTML = `<p>${messages.durationPrompt || '選んだコースの時間をお選びください。'}</p>`;
    renderDuration();
    return;
  }

  if (state.step === 'combination') {
    elements.stepMessage.innerHTML = `<p>${messages.comboPrompt || 'コースにオプションを追加して、あなたの症状やお悩みに適したカスタムのご提案です。'}</p>`;
    renderCombination();
    return;
  }

  if (state.step === 'options') {
    elements.stepMessage.innerHTML = `<p>${messages.optionPrompt || '気になるオプションを一覧から追加できます。'}</p><p>${messages.optionSkipNote || '不要の場合は、ページ下の「最終確認へ進む」ボタンで次にすすんでください。'}</p><p>${messages.optionSelection || 'オプションは原則コース時間内で対応します。必要なものをお選びください。'}</p>`;
    renderOptions();
    return;
  }

  if (state.step === 'confirm') {
    elements.stepMessage.innerHTML = `<p>${messages.finalConfirm || 'ありがとうございます。最終確認です。'}</p><p>${messages.formGuide || '予約内容をコピーしてフォームへ進めます。'}</p>`;
    renderConfirm();
  }
}

function renderGender() {
  const selected = state.user.gender;
  elements.stepPanel.innerHTML = `
    <h2 class="step-title">性別を選択</h2>
    <p class="step-subtitle">性別に応じて、症状項目とコース候補を出し分けます。</p>
    <div class="choice-grid" id="genderGrid"></div>
    <div class="inline-actions">
      <button class="inline-button primary" id="genderNextButton">次へ進む</button>
    </div>
  `;

  const grid = document.getElementById('genderGrid');
  [
    { id: 'male', title: '男性', desc: '' },
    { id: 'female', title: '女性', desc: '' },
  ].forEach(item => {
    const card = createChoiceCard({
      title: item.title,
      meta: '',
      desc: item.desc,
      note: selected === item.id ? '選択中' : '',
      badges: [],
      active: selected === item.id,
    });

    card.addEventListener('click', () => {
      state.user.gender = item.id;
      sanitizeSymptomsForGender();
      renderStep();
    });

    grid.appendChild(card);
  });

  document.getElementById('genderNextButton').addEventListener('click', () => {
    if (!state.user.gender) {
      alert('性別を選択してください。');
      return;
    }
    goToStep('age');
  });
}

function renderAge() {
  elements.stepPanel.innerHTML = `
    <h2 class="step-title">年代を選択</h2>
    <p class="step-subtitle">〜19、20〜29、30〜39、40〜49、50〜59、60〜 の中からお選びください。</p>
    <div class="choice-grid" id="ageGrid"></div>
    <div class="inline-actions">
      <button class="inline-button primary" id="ageNextButton">症状を選ぶ</button>
    </div>
  `;

  const grid = document.getElementById('ageGrid');
  AGE_GROUPS.forEach(group => {
    const isActive = state.user.ageGroup === group.id;
    const card = createChoiceCard({
      title: group.label,
      meta: '',
      desc: isActive ? '選択中です。' : 'この年代に合わせて並び順を調整します。',
      note: '',
      badges: [],
      active: isActive,
    });

    card.addEventListener('click', () => {
      state.user.age = group.age;
      state.user.ageGroup = group.id;
      state.user.ageLabel = group.label;
      renderStep();
    });

    grid.appendChild(card);
  });

  document.getElementById('ageNextButton').addEventListener('click', () => goToStep('symptoms'));
}

function renderSymptoms() {
  const visibleSymptoms = getVisibleSymptoms();
  elements.stepPanel.innerHTML = `
    <h2 class="step-title">症状を選択</h2>
    <p class="step-subtitle">${state.user.gender === 'male' ? '男性向けの症状項目' : '女性向けの症状項目'}を表示しています。複数選択できます。</p>
    <div class="choice-grid" id="symptomGrid"></div>
    <div class="inline-actions">
      <button class="inline-button primary" id="symptomNextButton">おすすめコースを見る</button>
    </div>
  `;

  const grid = document.getElementById('symptomGrid');
  visibleSymptoms.forEach(symptom => {
    const categoryLabel = symptom.category === 'face' ? 'フェイス' : 'ボディ';
    const isActive = state.symptoms.includes(symptom.id);
    const card = createChoiceCard({
      title: symptom.label,
      meta: categoryLabel,
      desc: '',
      note: isActive ? '選択中' : '',
      badges: [],
      active: isActive,
    });

    card.addEventListener('click', () => {
      state.symptoms = isActive
        ? state.symptoms.filter(id => id !== symptom.id)
        : [...state.symptoms, symptom.id];
      renderStep();
    });

    grid.appendChild(card);
  });

  document.getElementById('symptomNextButton').addEventListener('click', () => {
    if (!state.symptoms.length) {
      alert('お悩みの症状を1つ以上選択してください。');
      return;
    }
    state.selectedCourseBases = [];
    state.selectedCourses = [];
    state.selectedOptions = [];
    goToStep('courses');
  });
}

function renderCourses() {
  const recommended = pickRecommendedCourses(state.data.courses, state.user, state.symptoms);
  const selectedIds = getSelectedCourseIds();
  const selectedMarkup = state.selectedCourses.length
    ? `<div class="selected-course-box">
        <strong>選択中のコース</strong>
        <div class="selected-course-list">${state.selectedCourses
          .map(
            course => `
              <div class="selected-course-item">
                <div>
                  <div class="selected-course-name">${course.name}</div>
                  <div class="compact-meta">${formatDuration(course.durationMinutes)} / ${formatPrice(course.price)}</div>
                </div>
                <button class="remove-button" type="button" data-remove-course="${course.id}">外す</button>
              </div>
            `
          )
          .join('')}</div>
      </div>`
    : '<div class="helper-box">まずはおすすめコースから1つ選択してください。必要に応じて2つ目も追加できます。</div>';

  const companionCandidates = state.selectedCourseBases.length === 1
    ? recommended.filter(course => !selectedIds.includes(course.id)).slice(0, 3)
    : [];

  const companionMarkup = companionCandidates.length
    ? `
      <div class="helper-box">
        <strong>もう1コース追加するなら</strong>
        <p>最大2コースまで選べます。相性のよい候補を先にご提案します。</p>
        <div class="course-chip-list">${companionCandidates
          .map(
            course => `<button class="course-chip" type="button" data-add-course="${course.id}">${course.name}</button>`
          )
          .join('')}</div>
      </div>
    `
    : '';

  elements.stepPanel.innerHTML = `
    <h2 class="step-title">おすすめコース（最大2つ）</h2>
    <p class="step-subtitle">コースは最大2つまで選択できます。時間は次の画面で個別に選べます。</p>
    ${selectedMarkup}
    ${companionMarkup}
    <div class="choice-grid" id="courseGrid"></div>
    <div class="inline-actions">
      <button class="inline-button primary" id="courseNextButton">選択したコースの時間を選ぶ</button>
    </div>
  `;

  const grid = document.getElementById('courseGrid');
  if (!recommended.length) {
    grid.innerHTML = '<div class="error-box">条件に合うコースがありません。年代・性別・症状の組み合わせをご確認ください。</div>';
  } else {
    recommended.forEach(course => {
      const active = selectedIds.includes(course.id);
      const card = createChoiceCard({
        title: course.name,
        meta: getCourseMetaText(course),
        desc: course.description,
        note: active ? '選択中' : buildCourseReason(course),
        badges: course.badges || [],
        active,
      });

      card.addEventListener('click', () => toggleCourseSelection(course));
      grid.appendChild(card);
    });
  }

  document.querySelectorAll('[data-add-course]').forEach(button => {
    button.addEventListener('click', () => {
      const course = state.data.courses.find(item => item.id === button.dataset.addCourse);
      if (course) toggleCourseSelection(course, true);
    });
  });

  document.querySelectorAll('[data-remove-course]').forEach(button => {
    button.addEventListener('click', () => {
      removeCourseSelection(button.dataset.removeCourse);
      renderStep();
      updateSummary();
    });
  });

  document.getElementById('courseNextButton').addEventListener('click', () => {
    if (!state.selectedCourseBases.length) {
      alert('コースを1つ以上選択してください。');
      return;
    }
    goToStep('duration');
  });
}

function renderDuration() {
  if (!state.selectedCourseBases.length) {
    goToStep('courses');
    return;
  }

  elements.stepPanel.innerHTML = `
    <h2 class="step-title">時間を選択</h2>
    <p class="step-subtitle">選択した各コースのご希望時間を選んでください。</p>
    <div class="course-stack" id="durationStack"></div>
    <div class="inline-actions">
      <button class="inline-button primary" id="durationNextButton">カスタマイズのご提案を見る</button>
    </div>
  `;

  const stack = document.getElementById('durationStack');
  state.selectedCourseBases.forEach(course => {
    const pricingOptions = getSortedPricingOptions(course);
    const selectedCourse = getSelectedCourseById(course.id) || applyCoursePricing(course, getDefaultPricing(course));
    const section = document.createElement('section');
    section.className = 'duration-section';
    section.innerHTML = `
      <div class="selected-course-box">
        <strong>${course.name}</strong>
        <div class="compact-meta">${course.description}</div>
      </div>
      <div class="choice-grid" id="durationGrid-${course.id}"></div>
    `;
    stack.appendChild(section);

    const grid = section.querySelector(`#durationGrid-${course.id}`);

    pricingOptions.forEach((pricing, index) => {
      const isActive = Number(selectedCourse.durationMinutes) === Number(pricing.durationMinutes) && Number(selectedCourse.price) === Number(pricing.price);
      const pricingGuide = getPricingGuide(course, pricingOptions, index);
      const card = createChoiceCard({
        title: `${formatDuration(pricing.durationMinutes)} / ${formatPrice(pricing.price)}`,
        meta: pricingGuide.label ? `${course.name} / ${pricingGuide.label}` : course.name,
        desc: pricingGuide.description,
        note: isActive ? '選択中' : (pricingGuide.recommended ? 'おすすめ' : ''),
        badges: course.badges || [],
        active: isActive,
      });

      card.addEventListener('click', () => {
        setCoursePricing(course.id, pricing);
        renderStep();
        updateSummary();
      });

      grid.appendChild(card);
    });
  });

  document.getElementById('durationNextButton').addEventListener('click', () => goToStep('combination'));
}

function renderCombination() {
  const selectedCourseIds = getSelectedCourseIds();
  const recommendedOptions = pickRecommendedOptions(state.data.options, state.user, state.symptoms, selectedCourseIds).slice(0, 4);
  const selectedCourseSummary = state.selectedCourses
    .map(course => `${course.name}（${formatDuration(course.durationMinutes)} / ${formatPrice(course.price)}）`)
    .join(' / ');

  const comboMarkup = recommendedOptions.length
    ? `<div class="combo-list">${recommendedOptions
        .map(option => {
          const active = state.selectedOptions.some(item => item.id === option.id);
          return `
            <div class="combo-card">
              <strong>${option.name}</strong>
              <div>${option.description}</div>
              <div class="compact-meta">${getOptionMetaText(option)}</div>
              <div class="inline-actions compact-actions">
                <button class="inline-button ${active ? 'ghost' : 'primary'} combo-select-button" type="button" data-option-id="${option.id}">
                  ${active ? '提案から外す' : 'この提案を追加'}
                </button>
              </div>
            </div>
          `;
        })
        .join('')}</div>`
    : '<div class="helper-box">このコース組み合わせに対応するおすすめ提案がまだありません。このまま一覧へ進めます。</div>';

  elements.stepPanel.innerHTML = `
    <h2 class="step-title">カスタマイズのご提案</h2>
    <p class="step-subtitle">コースにオプションを追加して、あなたの症状やお悩みに適したカスタムのご提案です。</p>
    <div class="selected-course-box current-course-highlight">
      <strong>現在のコース</strong>
      <div class="current-course-text">${selectedCourseSummary}</div>
    </div>
    ${comboMarkup}
    <div class="inline-actions">
      <button class="inline-button ghost" id="goOptionsButton">オプション一覧から選ぶ</button>
      <button class="inline-button primary" id="comboNextButton">最終確認へ進む</button>
    </div>
  `;

  document.querySelectorAll('.combo-select-button').forEach(button => {
    button.addEventListener('click', () => {
      const option = state.data.options.find(item => item.id === button.dataset.optionId);
      if (!option) return;
      toggleOptionSelection(option);
      renderStep();
      updateSummary();
    });
  });

  document.getElementById('goOptionsButton').addEventListener('click', () => goToStep('options'));
  document.getElementById('comboNextButton').addEventListener('click', () => goToStep('confirm'));
}

function renderOptions() {
  const selectedCourseIds = getSelectedCourseIds();
  const recommended = pickRecommendedOptions(state.data.options, state.user, state.symptoms, selectedCourseIds);

  elements.stepPanel.innerHTML = `
    <h2 class="step-title">おすすめオプション</h2>
    <p class="step-subtitle">選択中のコースに対応するオプションのみ表示しています。複数選択できます。</p>
    <div class="choice-grid" id="optionGrid"></div>
    <div class="inline-actions">
      <button class="inline-button primary" id="optionNextButton">最終確認へ進む</button>
    </div>
  `;

  const grid = document.getElementById('optionGrid');
  if (!recommended.length) {
    grid.innerHTML = '<div class="helper-box">選択中のコースに対応するオプションはありません。このまま進めます。</div>';
  } else {
    recommended.forEach(option => {
      const active = state.selectedOptions.some(item => item.id === option.id);
      const card = createChoiceCard({
        title: option.name,
        meta: getOptionMetaText(option),
        desc: option.description,
        note: active ? '選択中' : (option.conciergePitch || option.notes || ''),
        badges: option.badges || [],
        active,
      });

      card.addEventListener('click', () => {
        toggleOptionSelection(option);
        renderStep();
        updateSummary();
      });

      grid.appendChild(card);
    });
  }

  document.getElementById('optionNextButton').addEventListener('click', () => goToStep('confirm'));
}

function renderConfirm() {
  const courseLines = state.selectedCourses.length
    ? state.selectedCourses
        .map(course => `<li>コース: ${course.name}（${formatDuration(course.durationMinutes)} / ${formatPrice(course.price)}）</li>`)
        .join('')
    : '<li>コース: 未選択</li>';

  const optionLines = state.selectedOptions.length
    ? state.selectedOptions.map(option => `<li>オプション: ${option.name}（${getOptionMetaText(option)}）</li>`).join('')
    : '<li>オプション: なし</li>';

  const totalMinutes = sumBy(state.selectedCourses, 'durationMinutes');
  const totalPrice = sumBy(state.selectedCourses, 'price') + sumBy(state.selectedOptions, 'price');

  elements.stepPanel.innerHTML = `
    <h2 class="step-title">最終確認</h2>
    <div class="confirm-card">
      <strong>予約内容</strong>
      <ul>
        <li>性別: ${getGenderLabel()}</li>
        <li>年代: ${state.user.ageLabel}</li>
        <li>症状: ${getSelectedSymptomLabels().join('、')}</li>
        ${courseLines}
        ${optionLines}
        <li>合計時間: ${formatDuration(totalMinutes)}</li>
        <li>合計金額: ${formatPrice(totalPrice)}</li>
      </ul>
    </div>
    <p class="notice">内容をコピーして、予約フォームへ進みます。</p>
    <div class="inline-actions">
      <button class="inline-button primary" id="copyReservationButton">予約内容をコピーしてフォームへ ＞</button>
    </div>
  `;

  document.getElementById('copyReservationButton').addEventListener('click', async () => {
    const reservationText = buildReservationText();
    try {
      await navigator.clipboard.writeText(reservationText);
      window.open(APP_CONFIG.reservationFormUrl, '_blank', 'noopener');
    } catch (error) {
      alert(`コピーに失敗しました。\n\n${reservationText}`);
    }
  });
}

function createChoiceCard({ title, meta, desc, note = '', badges = [], active = false }) {
  const node = elements.choiceCardTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector('.choice-title').textContent = title;
  node.querySelector('.choice-meta').textContent = meta || '';
  node.querySelector('.choice-desc').textContent = desc || '';
  node.querySelector('.choice-note').textContent = note || '';
  const badgeList = node.querySelector('.badge-list');
  badgeList.innerHTML = '';

  [...badges]
    .sort((a, b) => (BADGE_ORDER[a] || 99) - (BADGE_ORDER[b] || 99))
    .forEach(badge => {
      const span = document.createElement('span');
      span.className = `badge ${badgeClass(badge)}`;
      span.textContent = badge;
      badgeList.appendChild(span);
    });

  node.classList.toggle('active', active);
  return node;
}

function toggleCourseSelection(course, forceAdd = false) {
  const selectedIds = getSelectedCourseIds();
  const alreadySelected = selectedIds.includes(course.id);

  if (alreadySelected && !forceAdd) {
    removeCourseSelection(course.id);
  } else if (!alreadySelected) {
    if (state.selectedCourseBases.length >= 2) {
      alert('コースは最大2つまで選択できます。');
      return;
    }
    state.selectedCourseBases = [...state.selectedCourseBases, course];
    syncSelectedCourses();
  }

  syncSelectedOptions();
  renderStep();
  updateSummary();
}

function removeCourseSelection(courseId) {
  state.selectedCourseBases = state.selectedCourseBases.filter(course => course.id !== courseId);
  state.selectedCourses = state.selectedCourses.filter(course => course.id !== courseId);
  syncSelectedOptions();
}

function syncSelectedCourses() {
  const currentPricingMap = new Map(
    state.selectedCourses.map(course => [
      course.id,
      course.selectedPricing || { durationMinutes: course.durationMinutes, price: course.price },
    ])
  );

  state.selectedCourses = state.selectedCourseBases.map(course => applyCoursePricing(course, currentPricingMap.get(course.id) || getDefaultPricing(course)));
}

function toggleOptionSelection(option) {
  const exists = state.selectedOptions.some(item => item.id === option.id);
  state.selectedOptions = exists
    ? state.selectedOptions.filter(item => item.id !== option.id)
    : [...state.selectedOptions, option];
}

function syncSelectedOptions() {
  const selectedCourseIds = getSelectedCourseIds();
  state.selectedOptions = state.selectedOptions.filter(option => isOptionCompatible(option, selectedCourseIds));
}

function isOptionCompatible(option, selectedCourseIds) {
  if (!selectedCourseIds.length) return true;
  if (!option.compatibleCourseIds || !option.compatibleCourseIds.length) return true;
  return selectedCourseIds.some(id => option.compatibleCourseIds.includes(id));
}

function setCoursePricing(courseId, pricing) {
  state.selectedCourses = state.selectedCourses.map(course => {
    if (course.id !== courseId) return course;
    const base = state.selectedCourseBases.find(item => item.id === courseId) || course;
    return applyCoursePricing(base, pricing);
  });
}

function getVisibleSymptoms() {
  return state.data.symptoms
    .filter(symptom => symptom.active !== false)
    .filter(symptom => !symptom.genders || !symptom.genders.length || symptom.genders.includes(state.user.gender))
    .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
}

function sanitizeSymptomsForGender() {
  const allowedIds = new Set(getVisibleSymptoms().map(symptom => symptom.id));
  state.symptoms = state.symptoms.filter(id => allowedIds.has(id));
}

function getSelectedCourseIds() {
  return state.selectedCourseBases.map(course => course.id);
}

function getSelectedCourseById(courseId) {
  return state.selectedCourses.find(course => course.id === courseId) || null;
}

function getSortedPricingOptions(course) {
  const pricingOptions = course.pricingOptions?.length
    ? [...course.pricingOptions]
    : [{ durationMinutes: course.durationMinutes, price: course.price }];
  return pricingOptions.sort((a, b) => Number(a.durationMinutes) - Number(b.durationMinutes));
}

function getRecommendedPricingIndex(course, pricingOptions) {
  const explicitIndex = Number(course?.defaultPricingIndex);
  if (Number.isInteger(explicitIndex) && explicitIndex >= 0 && explicitIndex < pricingOptions.length) {
    return explicitIndex;
  }

  if (pricingOptions.length <= 1) return 0;
  if (pricingOptions.length === 2) return 1;
  if (pricingOptions.length === 3) return 1;
  return pricingOptions.length - 2;
}

function getPricingGuide(course, pricingOptions, index) {
  const count = pricingOptions.length;
  const recommendedIndex = getRecommendedPricingIndex(course, pricingOptions);

  if (count === 1) {
    return {
      label: '',
      description: '標準サイズです。',
      recommended: true,
    };
  }

  if (count === 2) {
    if (index === 0) {
      return {
        label: 'ショートサイズ',
        description: '※症状や体格により、省かせていただく部位があります。',
        recommended: false,
      };
    }
    return {
      label: 'おすすめのレギュラーサイズ',
      description: 'バランスよく受けていただきやすい基本プランです。',
      recommended: true,
    };
  }

  if (count === 3) {
    if (index === 0) {
      return {
        label: 'ショートサイズ',
        description: '※症状や体格により、省かせていただく部位があります。',
        recommended: false,
      };
    }
    if (index === recommendedIndex) {
      return {
        label: 'おすすめのレギュラーサイズ',
        description: 'バランスよく受けていただきやすいおすすめの基本プランです。',
        recommended: true,
      };
    }
    return {
      label: 'ロングサイズ',
      description: '※いつもよりお疲れの場合や、ゆっくり過ごされたい場合に。',
      recommended: false,
    };
  }

  if (index === 0) {
    return {
      label: 'ショートサイズ',
      description: '※症状や体格により、省かせていただく部位があります。',
      recommended: false,
    };
  }

  if (index < recommendedIndex) {
    return {
      label: 'スタンダードサイズ',
      description: 'まずは様子を見ながら受けたい方に選ばれやすい長さです。',
      recommended: false,
    };
  }

  if (index === recommendedIndex) {
    return {
      label: 'おすすめのレギュラーサイズ',
      description: 'しっかり整えやすく、標準プランとしておすすめしやすい長さです。',
      recommended: true,
    };
  }

  if (index === pricingOptions.length - 1) {
    return {
      label: 'スーパーロングサイズ',
      description: '※かなりお疲れの場合や、オプションも追加される場合に。',
      recommended: false,
    };
  }

  return {
    label: 'ロングサイズ',
    description: '※いつもよりお疲れの場合や、ゆっくり過ごされたい場合に。',
    recommended: false,
  };
}

function getDefaultPricing(course) {
  const pricingOptions = getSortedPricingOptions(course);
  return pricingOptions[getRecommendedPricingIndex(course, pricingOptions)] || {
    durationMinutes: course.durationMinutes,
    price: course.price,
  };
}

function applyCoursePricing(course, pricing) {
  if (!course) return null;
  return {
    ...course,
    durationMinutes: Number(pricing?.durationMinutes || course.durationMinutes || 0),
    price: Number(pricing?.price || course.price || 0),
    selectedPricing: pricing || null,
  };
}

function buildEmpathyMessage() {
  const messageMap = state.data.messages?.messages?.symptomEmpathy || {};
  const empathies = state.symptoms.map(id => messageMap[id]).filter(Boolean);
  if (empathies.length) return empathies[0];
  return state.user.gender === 'female'
    ? '女性向け条件に合わせてご案内します。'
    : '男性向け条件に合わせてご案内します。';
}

function buildCourseReason(course) {
  const strongHit = state.symptoms
    .map(id => ({ id, score: Number(course.symptomWeights?.[id] || 0) }))
    .sort((a, b) => b.score - a.score)[0];
  const symptom = state.data.symptoms.find(item => item.id === strongHit?.id);

  if (course.conciergePitch && strongHit?.score >= 8) {
    return course.conciergePitch;
  }

  if (strongHit?.score > 0 && symptom) {
    return `${symptom.label}を重視しておすすめ順を調整しています。`;
  }

  return course.conciergePitch || '年代・性別・相性を踏まえてご提案しています。';
}

function getCourseMetaText(course) {
  const pricingOptions = course.pricingOptions || [];
  if (!pricingOptions.length) return `${formatDuration(course.durationMinutes)} / ${formatPrice(course.price)}`;
  if (pricingOptions.length === 1) {
    return `${formatDuration(pricingOptions[0].durationMinutes)} / ${formatPrice(pricingOptions[0].price)}`;
  }
  const sorted = [...pricingOptions].sort((a, b) => a.durationMinutes - b.durationMinutes);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return `${formatDuration(min.durationMinutes)}〜${formatDuration(max.durationMinutes)} / ${formatPrice(min.price)}〜${formatPrice(max.price)}`;
}

function getOptionMetaText(option) {
  const withinText = option.withinCourseMinutes
    ? `コース内${option.withinCourseMinutes}分`
    : 'コース時間内対応';
  return `${withinText} / +${formatPrice(option.price)}`;
}

function getSelectedSymptomLabels() {
  return state.data.symptoms.filter(symptom => state.symptoms.includes(symptom.id)).map(symptom => symptom.label);
}

function getGenderLabel() {
  return state.user.gender === 'female' ? '女性' : '男性';
}

function buildReservationText() {
  return [
    '【予約希望内容】',
    `性別: ${getGenderLabel()}`,
    `年代: ${state.user.ageLabel}`,
    `症状: ${getSelectedSymptomLabels().join('、')}`,
    ...state.selectedCourses.map(course => `コース: ${course.name}（${formatDuration(course.durationMinutes)} / ${formatPrice(course.price)}）`),
    ...(state.selectedOptions.length
      ? state.selectedOptions.map(option => `オプション: ${option.name}（${getOptionMetaText(option)}）`)
      : ['オプション: なし']),
    `合計時間: ${elements.totalDuration.textContent}`,
    `合計金額: ${elements.totalPrice.textContent}`,
  ].join('\n');
}

function updateSummary() {
  const totalMinutes = sumBy(state.selectedCourses, 'durationMinutes');
  const totalPrice = sumBy(state.selectedCourses, 'price') + sumBy(state.selectedOptions, 'price');

  elements.totalDuration.textContent = formatDuration(totalMinutes);
  elements.totalPrice.textContent = formatPrice(totalPrice);

  const summaryParts = [];
  if (state.selectedCourses.length) {
    summaryParts.push(`コース: ${state.selectedCourses.map(course => course.name).join('、')}`);
  }
  if (state.selectedOptions.length) {
    summaryParts.push(`オプション: ${state.selectedOptions.map(option => option.name).join('、')}`);
  }

  elements.selectionSummary.textContent = summaryParts.join(' / ') || 'コースとオプションがここに表示されます';
}

bootstrap().catch(error => {
  console.error(error);
  elements.introMessage.innerHTML = '<p>データ読み込みに失敗しました。JSONファイル構成をご確認ください。</p>';
});
