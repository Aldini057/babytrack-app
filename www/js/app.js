// BabyTrack Mobile — Controlador Principal Alpine.js (100% Local-First + Híbrido Familiar)
function babyTrackApp() {
  return {
    loaded: false,
    locked: false,
    pinInput: '',
    pinError: '',
    activeTab: 'inicio',
    medicalSubTab: 'citas',
    apptFilter: 'ALL',
    visitFilter: 'ALL',
    checklistCategory: 'ALL',
    journalFilter: 'ALL',

    state: BabyDB.createDefaultState(),

    // Modales y drawers
    showOnboarding: false,
    showCalibrateModal: false,
    showConsultationDrawer: false,
    showApptModal: false,
    showStudyModal: false,
    showBookModal: false,
    showTipModal: false,
    showFamilyModal: false,
    showChecklistModal: false,
    showJournalModal: false,
    showMomentModal: false,
    viewerItem: null,

    // Formularios
    calibrateForm: { dueDate: '', currentWeeks: 6, currentDays: 0, momBloodType: '', allergiesNotes: '', pinEnabled: false, pinCode: '1419', babyNickname: '', momName: '', dadName: '' },
    apptForm: { id: null, appointmentType: 'MEDICO', appointmentDate: '', doctorOrClinic: '', status: 'SCHEDULED', reminderMinutesBefore: '1440', momWeightKg: '', bloodPressure: '', babyHeartRateBpm: '', questionsForDoctor: '', doctorNotesAndDiagnosis: '' },
    studyForm: { studyType: 'DIAGNOSTICO', title: '', studyDate: '', appointmentId: '', summaryNotes: '', saveAsAppointment: false, appointmentTime: '08:00', pendingFiles: [] },
    checkForm: { category: 'ROPA', itemName: '', description: '', trimesterPriority: 2, estimatedCostMxn: 300 },
    journalForm: { authorRole: 'MAMA', authorDisplayName: '', title: '', content: '', pendingPhoto: null },
    momentForm: { title: '', momentDate: '', caption: '', pendingPhoto: null },
    familyNoteForm: { authorDisplayName: '', title: '', content: '' },

    // Bienestar fetal en tiempo real
    kickCounter: { count: 0, startedAtMs: null, elapsedSeconds: 0, intervalId: null },
    contractionTimer: { active: false, startedAtMs: null, lastStartedAtMs: null, elapsedSeconds: 0, intervalId: null },
    toastMessage: '',

    async init() {
      this.state = await BabyDB.loadState();
      this.applyTheme(this.state.settings.genderMode || 'SURPRISE');

      if (!this.state.settings.onboarded) {
        this.calibrateForm.dueDate = this.state.settings.dueDate;
        this.calibrateForm.babyNickname = this.state.settings.babyNickname;
        this.calibrateForm.momName = this.state.settings.momName;
        this.calibrateForm.dadName = this.state.settings.dadName;
        this.showOnboarding = true;
      } else if (this.state.settings.pinEnabled) {
        this.locked = true;
      }

      const today = BabyCalc.localIsoDate();
      this.studyForm.studyDate = today;
      this.momentForm.momentDate = today;
      this.loaded = true;
    },

    async persist() {
      await BabyDB.saveState(this.state);
    },

    notify(msg) {
      this.toastMessage = msg;
      setTimeout(() => { if (this.toastMessage === msg) this.toastMessage = ''; }, 3000);
    },

    applyTheme(mode) {
      document.body.setAttribute('data-theme', mode || 'SURPRISE');
    },

    nextId() {
      this.state.nextId = (this.state.nextId || 100) + 1;
      return this.state.nextId;
    },

    get metrics() {
      return BabyCalc.calculateMetrics(
        this.state.settings.dueDate,
        this.state.settings.calibrationOffsetDays
      );
    },

    get activeMilestonePrompt() {
      const w = this.metrics.weeks;
      const dismissed = this.state.settings.dismissedMilestones || [];
      if (w >= 40 && !dismissed.includes(40)) return { week: 40, title: '¡Llegó el gran día (Semana 40)!', text: '¡Felicidades por traer a tu bebé al mundo! Si BabyTrack te acompañó con cariño, puedes invitarnos un café o descargar tu Libro de Oro.' };
      if (w >= 24 && w < 40 && !dismissed.includes(24)) return { week: 24, title: '¡Semana 24 alcanzada!', text: 'Tu bebé ya te escucha hablar. ¿Te ha sido útil BabyTrack? Tu apoyo voluntario mantiene la app accesible y sin anuncios molestos.' };
      if (w >= 12 && w < 24 && !dismissed.includes(12)) return { week: 12, title: '¡1er Trimestre completado!', text: '¡Felicidades por llegar a la semana 12! Si quieres apoyar este proyecto independiente, puedes dejarnos una propina simbólica.' };
      return null;
    },

    get hideAdsForEthics() {
      // Regla de oro ética: nunca mostrar banner en Modo Consulta Médica, Cronómetro de Contracciones o si ya se desbloqueó
      if (this.state.settings.adsRemoved || this.state.settings.premiumBookUnlocked) return true;
      if (this.showConsultationDrawer) return true;
      if (this.activeTab === 'medico' && this.medicalSubTab === 'bienestar' && this.contractionTimer.active) return true;
      return false;
    },

    unlockWithPin() {
      if (this.pinInput.trim() === (this.state.settings.pinCode || '1419')) {
        this.locked = false;
        this.pinInput = '';
        this.pinError = '';
      } else {
        this.pinError = 'PIN incorrecto';
      }
    },

    async completeOnboarding() {
      this.state.settings.babyNickname = (this.calibrateForm.babyNickname || 'Nuestro Bebé').trim();
      this.state.settings.momName = (this.calibrateForm.momName || 'Mamá').trim();
      this.state.settings.dadName = (this.calibrateForm.dadName || 'Papá').trim();
      if (this.calibrateForm.dueDate) {
        this.state.settings.dueDate = this.calibrateForm.dueDate;
        this.state.settings.calibrationOffsetDays = 0;
      }
      this.state.settings.onboarded = true;
      this.showOnboarding = false;
      await this.persist();
      this.notify('¡Bienvenidos a BabyTrack! Todo guardado en tu teléfono.');
    },

    async setGenderTheme(mode) {
      this.state.settings.genderMode = mode;
      this.applyTheme(mode);
      if (mode === 'BOY' && this.state.settings.babyNickname === 'Nuestro Bebé') this.state.settings.babyNickname = 'Nuestro Niño';
      if (mode === 'GIRL' && this.state.settings.babyNickname === 'Nuestro Bebé') this.state.settings.babyNickname = 'Nuestra Niña';
      await this.persist();
    },

    async toggleActiveParent() {
      this.state.settings.activeParent = this.state.settings.activeParent === 'MAMA' ? 'PAPA' : 'MAMA';
      await this.persist();
    },

    openCalibrate() {
      const m = this.metrics;
      this.calibrateForm = {
        dueDate: this.state.settings.dueDate,
        currentWeeks: m.weeks,
        currentDays: m.days,
        momBloodType: this.state.settings.momBloodType || '',
        allergiesNotes: this.state.settings.allergiesNotes || '',
        pinEnabled: !!this.state.settings.pinEnabled,
        pinCode: this.state.settings.pinCode || '1419',
        babyNickname: this.state.settings.babyNickname,
        momName: this.state.settings.momName,
        dadName: this.state.settings.dadName
      };
      this.showCalibrateModal = true;
    },

    async saveCalibration(useWeeksDays = false) {
      this.state.settings.dueDate = this.calibrateForm.dueDate || this.state.settings.dueDate;
      if (useWeeksDays) {
        this.state.settings.calibrationOffsetDays = BabyCalc.calculateOffsetFromWeeksDays(
          this.state.settings.dueDate,
          this.calibrateForm.currentWeeks,
          this.calibrateForm.currentDays
        );
      }
      this.state.settings.momBloodType = (this.calibrateForm.momBloodType || '').trim();
      this.state.settings.allergiesNotes = (this.calibrateForm.allergiesNotes || '').trim();
      this.state.settings.pinEnabled = !!this.calibrateForm.pinEnabled;
      if (this.calibrateForm.pinCode) this.state.settings.pinCode = this.calibrateForm.pinCode.trim();
      this.state.settings.babyNickname = (this.calibrateForm.babyNickname || 'Nuestro Bebé').trim();
      this.state.settings.momName = (this.calibrateForm.momName || 'Mamá').trim();
      this.state.settings.dadName = (this.calibrateForm.dadName || 'Papá').trim();
      this.showCalibrateModal = false;
      await this.persist();
      this.notify('Configuración guardada localmente.');
    },

    // --- CITAS Y SIGNOS VITALES ---
    get imminentAppointments() {
      const todayIso = BabyCalc.localIsoDate();
      const start = new Date(todayIso + 'T00:00:00');
      const maxWin = new Date(start.getTime() + 48 * 60 * 60 * 1000);
      return (this.state.appointments || []).filter(a => {
        if (a.status !== 'SCHEDULED' || !a.appointmentDate) return false;
        const dt = new Date(a.appointmentDate);
        return dt >= start && dt <= maxWin;
      });
    },

    get filteredAppointments() {
      const list = [...(this.state.appointments || [])].sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));
      if (this.apptFilter === 'ALL') return list;
      return list.filter(a => (a.appointmentType || 'MEDICO') === this.apptFilter);
    },

    get appointmentsWithVitals() {
      return [...(this.state.appointments || [])]
        .filter(a => a.momWeightKg || a.bloodPressure || a.babyHeartRateBpm)
        .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));
    },

    get latestVitals() {
      const list = this.appointmentsWithVitals;
      return list.length > 0 ? list[list.length - 1] : null;
    },

    get pendingQuestions() {
      return (this.state.appointments || []).filter(a => a.status === 'SCHEDULED' && a.questionsForDoctor && a.questionsForDoctor.trim());
    },

    openApptModal(defaultType = 'MEDICO', apptToEdit = null) {
      if (apptToEdit) {
        this.apptForm = {
          id: apptToEdit.id,
          appointmentType: apptToEdit.appointmentType || 'MEDICO',
          appointmentDate: (apptToEdit.appointmentDate || '').slice(0, 16),
          doctorOrClinic: apptToEdit.doctorOrClinic,
          status: apptToEdit.status,
          reminderMinutesBefore: String(apptToEdit.reminderMinutesBefore || 1440),
          momWeightKg: apptToEdit.momWeightKg ?? '',
          bloodPressure: apptToEdit.bloodPressure || '',
          babyHeartRateBpm: apptToEdit.babyHeartRateBpm ?? '',
          questionsForDoctor: apptToEdit.questionsForDoctor || '',
          doctorNotesAndDiagnosis: apptToEdit.doctorNotesAndDiagnosis || ''
        };
      } else {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        this.apptForm = {
          id: null,
          appointmentType: defaultType,
          appointmentDate: now.toISOString().slice(0, 16),
          doctorOrClinic: '',
          status: 'SCHEDULED',
          reminderMinutesBefore: '1440',
          momWeightKg: '',
          bloodPressure: '',
          babyHeartRateBpm: '',
          questionsForDoctor: '',
          doctorNotesAndDiagnosis: ''
        };
      }
      this.showApptModal = true;
    },

    async saveAppointment() {
      const m = BabyCalc.calculateMetrics(
        this.state.settings.dueDate,
        this.state.settings.calibrationOffsetDays,
        this.apptForm.appointmentDate.slice(0, 10)
      );
      const item = {
        id: this.apptForm.id || this.nextId(),
        appointmentType: this.apptForm.appointmentType || 'MEDICO',
        appointmentDate: this.apptForm.appointmentDate,
        doctorOrClinic: this.apptForm.doctorOrClinic.trim(),
        specialty: this.apptForm.appointmentType === 'LABORATORIO' ? 'Laboratorio Clínico' : (this.apptForm.appointmentType === 'ECO' ? 'Ultrasonido Obstétrico' : 'Ginecología y Obstetricia'),
        gestationalWeek: m.weeks,
        gestationalDay: m.days,
        momWeightKg: this.apptForm.momWeightKg !== '' ? parseFloat(this.apptForm.momWeightKg) : null,
        bloodPressure: this.apptForm.bloodPressure ? this.apptForm.bloodPressure.trim() : null,
        babyHeartRateBpm: this.apptForm.babyHeartRateBpm !== '' ? parseInt(this.apptForm.babyHeartRateBpm, 10) : null,
        questionsForDoctor: this.apptForm.questionsForDoctor ? this.apptForm.questionsForDoctor.trim() : null,
        doctorNotesAndDiagnosis: this.apptForm.doctorNotesAndDiagnosis ? this.apptForm.doctorNotesAndDiagnosis.trim() : null,
        status: this.apptForm.status || 'SCHEDULED',
        reminderMinutesBefore: parseInt(this.apptForm.reminderMinutesBefore || '1440', 10)
      };

      if (this.apptForm.id) {
        const idx = this.state.appointments.findIndex(x => x.id === this.apptForm.id);
        if (idx >= 0) this.state.appointments[idx] = item;
      } else {
        this.state.appointments.push(item);
      }
      this.showApptModal = false;
      this.medicalSubTab = 'citas';
      await this.persist();
      this.notify('Cita guardada en tu teléfono.');
    },

    async deleteAppointment(id) {
      if (!confirm('¿Eliminar esta cita?')) return;
      this.state.appointments = this.state.appointments.filter(a => a.id !== id);
      await this.persist();
    },

    openGoogleCalendarFor(appt) {
      window.open(BabyCalendar.buildGoogleCalendarUrl(appt, this.state.settings.babyNickname), '_blank');
    },

    downloadIcsFor(appt) {
      BabyCalendar.downloadIcs(appt, this.state.settings.babyNickname);
    },

    // --- ESTUDIOS, CONSULTAS, LAB Y ECOS (COMPRIMIDOS EN EL DISPOSITIVO) ---
    get medicalVisitResults() {
      const list = (this.state.studies || []).filter(s => ['DIAGNOSTICO', 'RECETA', 'DOCUMENTO_CLINICO'].includes(s.studyType));
      return this.visitFilter === 'ALL' ? list : list.filter(s => s.studyType === this.visitFilter);
    },

    get labResults() {
      return (this.state.studies || []).filter(s => s.studyType === 'LABORATORIO');
    },

    get ultrasounds() {
      return (this.state.studies || []).filter(s => s.studyType === 'ULTRASONIDO');
    },

    openStudyModal(defaultType = 'DIAGNOSTICO') {
      this.studyForm = {
        studyType: defaultType,
        title: '',
        studyDate: BabyCalc.localIsoDate(),
        appointmentId: '',
        summaryNotes: '',
        saveAsAppointment: false,
        appointmentTime: '08:00',
        pendingFiles: []
      };
      this.showStudyModal = true;
    },

    async handleStudyFilesSelect(e) {
      const files = Array.from(e.target.files || []);
      const processed = [];
      for (const f of files) {
        const item = await BabyStorage.processAttachmentFile(f);
        if (item) processed.push({ id: this.nextId(), ...item });
      }
      this.studyForm.pendingFiles = processed;
    },

    async saveStudy() {
      if (this.studyForm.studyType === 'LABORATORIO' && this.studyForm.saveAsAppointment) {
        const dtStr = `${this.studyForm.studyDate}T${this.studyForm.appointmentTime || '08:00'}`;
        const m = BabyCalc.calculateMetrics(this.state.settings.dueDate, this.state.settings.calibrationOffsetDays, this.studyForm.studyDate);
        this.state.appointments.push({
          id: this.nextId(),
          appointmentType: 'LABORATORIO',
          appointmentDate: dtStr,
          doctorOrClinic: this.studyForm.title.trim(),
          specialty: 'Laboratorio Clínico',
          gestationalWeek: m.weeks,
          gestationalDay: m.days,
          questionsForDoctor: this.studyForm.summaryNotes || null,
          status: 'SCHEDULED',
          reminderMinutesBefore: 1440
        });
        this.showStudyModal = false;
        this.medicalSubTab = 'citas';
        this.apptFilter = 'LABORATORIO';
        await this.persist();
        this.notify('Cita de laboratorio agendada.');
        return;
      }

      const m = BabyCalc.calculateMetrics(this.state.settings.dueDate, this.state.settings.calibrationOffsetDays, this.studyForm.studyDate);
      this.state.studies.unshift({
        id: this.nextId(),
        studyType: this.studyForm.studyType,
        title: this.studyForm.title.trim(),
        studyDate: this.studyForm.studyDate,
        gestationalWeek: m.weeks,
        gestationalDay: m.days,
        summaryNotes: this.studyForm.summaryNotes ? this.studyForm.summaryNotes.trim() : '',
        createdBy: this.state.settings.activeParent,
        attachments: this.studyForm.pendingFiles || []
      });
      this.showStudyModal = false;
      if (this.studyForm.studyType === 'ULTRASONIDO') this.medicalSubTab = 'ecos';
      else if (this.studyForm.studyType === 'LABORATORIO') this.medicalSubTab = 'laboratorio';
      else this.medicalSubTab = 'consultas';
      await this.persist();
      this.notify('Registro médico guardado localmente.');
    },

    async deleteStudy(id) {
      if (!confirm('¿Eliminar este registro?')) return;
      this.state.studies = this.state.studies.filter(s => s.id !== id);
      await this.persist();
    },

    // --- MONITOR FETAL (PATADITAS Y CONTRACCIONES) ---
    formatSeconds(sec) {
      const s = Math.max(0, Math.floor(sec || 0));
      return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    },

    registerKickTap() {
      if (this.kickCounter.count === 0) {
        this.kickCounter.startedAtMs = Date.now();
        this.kickCounter.elapsedSeconds = 0;
        if (this.kickCounter.intervalId) clearInterval(this.kickCounter.intervalId);
        this.kickCounter.intervalId = setInterval(() => {
          this.kickCounter.elapsedSeconds = Math.floor((Date.now() - this.kickCounter.startedAtMs) / 1000);
        }, 1000);
      }
      this.kickCounter.count += 1;
      if (this.kickCounter.count >= 10) this.saveKickSession();
    },

    resetKickCounter() {
      if (this.kickCounter.intervalId) clearInterval(this.kickCounter.intervalId);
      this.kickCounter = { count: 0, startedAtMs: null, elapsedSeconds: 0, intervalId: null };
    },

    async saveKickSession() {
      if (this.kickCounter.count === 0) return;
      const m = this.metrics;
      this.state.fetalLogs.unshift({
        id: this.nextId(),
        logType: 'PATADITAS',
        recordedAt: new Date().toISOString(),
        gestationalWeek: m.weeks,
        gestationalDay: m.days,
        kickCount: this.kickCounter.count,
        durationSeconds: Math.max(1, this.kickCounter.elapsedSeconds || 1)
      });
      this.resetKickCounter();
      await this.persist();
      this.notify('Sesión de pataditas guardada.');
    },

    async toggleContractionTimer() {
      if (!this.contractionTimer.active) {
        const now = Date.now();
        this.contractionTimer.active = true;
        this.contractionTimer.startedAtMs = now;
        this.contractionTimer.elapsedSeconds = 0;
        if (this.contractionTimer.intervalId) clearInterval(this.contractionTimer.intervalId);
        this.contractionTimer.intervalId = setInterval(() => {
          this.contractionTimer.elapsedSeconds = Math.floor((Date.now() - this.contractionTimer.startedAtMs) / 1000);
        }, 1000);
      } else {
        if (this.contractionTimer.intervalId) clearInterval(this.contractionTimer.intervalId);
        const dur = Math.max(1, this.contractionTimer.elapsedSeconds || 1);
        let intervalMins = null;
        if (this.contractionTimer.lastStartedAtMs) {
          intervalMins = Number(((this.contractionTimer.startedAtMs - this.contractionTimer.lastStartedAtMs) / 60000).toFixed(1));
        }
        this.contractionTimer.lastStartedAtMs = this.contractionTimer.startedAtMs;
        this.contractionTimer.active = false;
        this.contractionTimer.elapsedSeconds = 0;

        const m = this.metrics;
        this.state.fetalLogs.unshift({
          id: this.nextId(),
          logType: 'CONTRACCION',
          recordedAt: new Date().toISOString(),
          gestationalWeek: m.weeks,
          gestationalDay: m.days,
          durationSeconds: dur,
          intervalMinutes: intervalMins
        });
        await this.persist();
        this.notify('Contracción registrada.');
      }
    },

    async deleteFetalLog(id) {
      this.state.fetalLogs = this.state.fetalLogs.filter(f => f.id !== id);
      await this.persist();
    },

    // --- CHECKLIST + AFILIADOS AMAZON MX ---
    get filteredChecklist() {
      if (this.checklistCategory === 'ALL') return this.state.checklist;
      return this.state.checklist.filter(i => i.category === this.checklistCategory);
    },

    get checklistStats() {
      const items = this.state.checklist || [];
      const done = items.filter(i => i.isCompleted).length;
      const est = items.reduce((acc, i) => acc + Number(i.estimatedCostMxn || 0), 0);
      const act = items.reduce((acc, i) => acc + Number(i.actualCostMxn || 0), 0);
      return { total: items.length, done, pct: items.length ? Math.round((done / items.length) * 100) : 0, est, act };
    },

    amazonLink(item) {
      return BabyDB.amazonAffiliateUrl(item);
    },

    async toggleChecklistItem(item) {
      item.isCompleted = !item.isCompleted;
      if (item.isCompleted) {
        item.completedBy = this.state.settings.activeParent;
        if (!item.actualCostMxn) item.actualCostMxn = item.estimatedCostMxn;
      } else {
        item.completedBy = null;
      }
      await this.persist();
    },

    async addChecklistItem() {
      this.state.checklist.push({
        id: this.nextId(),
        category: this.checkForm.category,
        itemName: this.checkForm.itemName.trim(),
        description: this.checkForm.description.trim(),
        trimesterPriority: Number(this.checkForm.trimesterPriority || 2),
        estimatedCostMxn: Number(this.checkForm.estimatedCostMxn || 0),
        actualCostMxn: 0,
        isCompleted: false,
        completedBy: null,
        amazonQuery: this.checkForm.itemName.trim() + ' bebe'
      });
      this.checkForm.itemName = '';
      this.checkForm.description = '';
      this.showChecklistModal = false;
      await this.persist();
    },

    // --- DIARIO & MOMENTOS ---
    get filteredJournal() {
      if (this.journalFilter === 'ALL') return this.state.journal;
      return this.state.journal.filter(n => n.authorRole === this.journalFilter);
    },

    async handleJournalPhoto(e) {
      const f = e.target.files?.[0];
      if (!f) return;
      const processed = await BabyStorage.compressImageFile(f);
      this.journalForm.pendingPhoto = processed.dataUrl;
    },

    async saveJournalNote() {
      const m = this.metrics;
      const role = this.journalForm.authorRole;
      const displayName = role === 'MAMA' ? this.state.settings.momName : (role === 'PAPA' ? this.state.settings.dadName : (this.journalForm.authorDisplayName || 'Familiar'));
      this.state.journal.unshift({
        id: this.nextId(),
        authorRole: role,
        authorDisplayName: displayName,
        title: this.journalForm.title.trim(),
        content: this.journalForm.content.trim(),
        gestationalWeek: m.weeks,
        gestationalDay: m.days,
        attachedImageDataUrl: this.journalForm.pendingPhoto,
        createdAt: new Date().toISOString()
      });
      this.journalForm = { authorRole: this.state.settings.activeParent, authorDisplayName: '', title: '', content: '', pendingPhoto: null };
      this.showJournalModal = false;
      await this.persist();
      this.notify('Carta guardada en tu Diario.');
    },

    async handleMomentPhoto(e) {
      const f = e.target.files?.[0];
      if (!f) return;
      const processed = await BabyStorage.compressImageFile(f);
      this.momentForm.pendingPhoto = processed.dataUrl;
    },

    async saveMoment() {
      if (!this.momentForm.pendingPhoto) { alert('Selecciona una foto.'); return; }
      const m = BabyCalc.calculateMetrics(this.state.settings.dueDate, this.state.settings.calibrationOffsetDays, this.momentForm.momentDate);
      this.state.moments.unshift({
        id: this.nextId(),
        title: this.momentForm.title.trim(),
        caption: this.momentForm.caption.trim(),
        momentDate: this.momentForm.momentDate,
        gestationalWeek: m.weeks,
        gestationalDay: m.days,
        imageDataUrl: this.momentForm.pendingPhoto,
        uploadedBy: this.state.settings.activeParent
      });
      this.momentForm = { title: '', momentDate: BabyCalc.localIsoDate(), caption: '', pendingPhoto: null };
      this.showMomentModal = false;
      await this.persist();
      this.notify('Momento agregado al álbum.');
    },

    // --- HÍBRIDO FAMILIAR (WHATSAPP + CLOUD RUN LINK) ---
    get whatsappShareUrl() {
      const m = this.metrics;
      const s = this.state.settings;
      const cloudUrl = (s.familyCloudEndpoint || '').trim();
      const linkLine = cloudUrl ? `\n\nMira los ecos y déjanos una cartita privada aquí: ${cloudUrl}` : '';
      const msg = `¡Hola familia! Ya cumplimos ${m.weeks} semanas y ${m.days} días de embarazo (${m.progressPercent}%).\nNuestro ${s.babyNickname} ya tiene el tamaño de: ${m.sizeEmoji} ${m.sizeComparison} (${m.sizeWeight}).${linkLine}\n\nSeguimiento con BabyTrack`;
      return `https://wa.me/?text=${encodeURIComponent(msg)}`;
    },

    async saveFamilyNoteLocal() {
      const m = this.metrics;
      this.state.journal.unshift({
        id: this.nextId(),
        authorRole: 'FAMILIA',
        authorDisplayName: this.familyNoteForm.authorDisplayName.trim(),
        title: this.familyNoteForm.title.trim(),
        content: this.familyNoteForm.content.trim(),
        gestationalWeek: m.weeks,
        gestationalDay: m.days,
        createdAt: new Date().toISOString()
      });
      this.familyNoteForm = { authorDisplayName: '', title: '', content: '' };
      await this.persist();
      this.notify('Mensaje familiar guardado en tu Diario privado.');
    },

    // --- EXPORTACIÓN DUAL (CRUDO GRATIS vs LIBRO DE ORO $49 MXN) + RESPALDO JSON ---
    downloadRawClinicalReport() {
      const html = BabyExport.buildRawClinicalHtml(this.state, this.metrics);
      BabyExport.openDocumentInTab(html, `expediente-clinico-babytrack-${BabyCalc.localIsoDate()}.html`);
    },

    openMemoryBook(previewOnly = false) {
      const html = BabyExport.buildMemoryBookHtml(this.state, this.metrics, previewOnly && !this.state.settings.premiumBookUnlocked);
      BabyExport.openDocumentInTab(html, `libro-de-oro-${BabyCalc.localIsoDate()}.html`);
    },

    async unlockMemoryBookDemo() {
      this.state.settings.premiumBookUnlocked = true;
      this.state.settings.adsRemoved = true;
      this.showBookModal = false;
      await this.persist();
      this.notify('¡Libro de Oro desbloqueado y anuncios eliminados!');
      this.openMemoryBook(false);
    },

    async supportWithTip(amountMxn) {
      this.state.settings.adsRemoved = true;
      const w = this.activeMilestonePrompt?.week;
      if (w && !this.state.settings.dismissedMilestones.includes(w)) {
        this.state.settings.dismissedMilestones.push(w);
      }
      this.showTipModal = false;
      await this.persist();
      this.notify(`¡Muchísimas gracias por tu apoyo de $${amountMxn} MXN!`);
    },

    async dismissMilestone(week) {
      if (!this.state.settings.dismissedMilestones.includes(week)) {
        this.state.settings.dismissedMilestones.push(week);
        await this.persist();
      }
    },

    exportFullJsonBackup() {
      const blob = new Blob([JSON.stringify(this.state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `respaldo-babytrack-${BabyCalc.localIsoDate()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      this.notify('Respaldo local descargado.');
    },

    async importJsonBackup(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed.settings) throw new Error('Archivo de respaldo inválido');
        this.state = Object.assign(BabyDB.createDefaultState(), parsed);
        this.applyTheme(this.state.settings.genderMode || 'SURPRISE');
        await this.persist();
        this.notify('¡Respaldo restaurado correctamente!');
      } catch (err) {
        alert(err.message);
      }
    }
  };
}
