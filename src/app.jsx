import React from 'react';
import { AddButton } from './add-button.jsx';
import { CheckinCelebration, CheckinModal } from './checkin-modal.jsx';
import { GrainOverlay } from './compound-ui.jsx';
import { TabBar } from './home-components.jsx';
import { DEMO_STATES } from './home-data.jsx';
import { HomeScreen } from './home-screen.jsx';
import { deriveLiveState, isoDate, loadCheckins, recordCheckin, saveCheckins } from './live-state.jsx';
import { MacroCalculator } from './macro-calc-screen.jsx';
import { InstallPrompt, ResponsiveFrame, useIsMobile } from './mobile-shell.jsx';
import { NutritionTab } from './nutrition-tab.jsx';
import { ExitedScreen, SaveExitModal, Screen1RM, ScreenAge, ScreenAlcohol, ScreenCheckInTime, ScreenComplete, ScreenEquipment, ScreenFitnessLevel, ScreenGratitudeBuilder, ScreenGratitudeIntro, ScreenName, ScreenStepsSleep, ScreenTrackFood, ScreenTrainingDays, ScreenWeighInTime, ScreenWeight, ScreenWelcome } from './onboarding-screens.jsx';
import { alcoholOn } from './alcohol.js';
import { ReportsScreen } from './reports-screen.jsx';
import { SettingsScreen } from './settings-screen.jsx';
import { markJoined } from './mid-week-join.js';
import { TweakButton, TweakColor, TweakRadio, TweakSection, TweakSelect, TweakToggle, TweaksPanel, useTweaks } from './tweaks-panel.jsx';
import { PastWorkouts, WeeklyPlan, WorkoutDashboard } from './workout-dashboard.jsx';
import { SavedWorkoutsScreen } from './workout-enhancements.jsx';
import { NewWorkoutFlow, WorkoutHome } from './workout-screens.jsx';
import { WorkoutSession } from './workout-session.jsx';

// app.jsx — COMPOUND root: state, step machine, persistence, frame, tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#F2A30F",
  "density": "regular",
  "tone": "coach",
  "grain": true,
  "demoState": "live"
}/*EDITMODE-END*/;

const TONE_HEADLINES = {
  coach: {
    name: { t: 'WHAT SHOULD', a: 'WE CALL YOU?', s: "First name is fine. We'll use it sparingly — when it counts." },
    age: { t: 'WHEN WERE', a: 'YOU BORN?', s: "Real date — we'll wish you a happy birthday and gift you a streak freeze." },
    weight: { t: 'WEIGHT', a: '& TARGET.', s: "Today's number, and where you want to land. Friday weigh-ins will tell the rest." },
    days: { t: 'HOW MANY DAYS', a: 'DO YOU LIFT?', s: "The honest answer, not the aspirational one. We'll hold you to it." },
    base: { t: 'DAILY', a: 'BASELINES.', s: 'The two metrics that move everything else. Set targets you can actually defend.' },
    eq: { t: 'WHERE DO', a: 'YOU TRAIN?', s: "We'll generate workouts that actually use what you have. Switch any time." },
    ci: { t: 'NIGHTLY', a: 'CHECK-IN.', s: "A short, honest 9-question reflection. Pick the time you'll actually be free." },
    wi: { t: 'FRIDAY', a: 'WEIGH-IN.', s: 'Every Friday morning. Post bathroom, pre water, pre breakfast. One number.' },
    gi: { t: 'BUILD YOUR', a: 'GRATITUDE LIBRARY.', s: 'Each night the app pulls 3 random items for you. The bigger your library, the deeper the well. Aim for 20–50 items.' },
    fl: { t: 'WHERE ARE YOU', a: 'STARTING FROM?', s: 'Be honest — overshooting only slows your progress. The AI calibrates from here.' },
    rm: { t: 'CURRENT', a: 'ESTIMATES.', s: "Roughly what you'd grind out for one rep, today, fresh. Skip if you're not sure — we'll learn it from session 1." },
    tf: { t: 'WANT TO TRACK', a: 'FOOD & CALORIES?', s: "Optional. If yes, we'll calculate your targets and you can log meals. If no, we still track weight." },
    al: { t: 'DO YOU WANT TO', a: 'TRACK ALCOHOL?', s: 'Optional. If yes, set a weekly nip limit — Home shows the week, Nutrition shows each day, and you build alcohol-free-day streaks. If no, we hide all of it.' },
  },
  quiet: {
    name: { t: 'YOUR', a: 'NAME.', s: 'First name.' },
    age: { t: 'DATE OF', a: 'BIRTH.', s: 'Day. Month. Year.' },
    weight: { t: 'WEIGHT', a: '& TARGET.', s: 'Current. Goal.' },
    days: { t: 'TRAINING', a: 'CADENCE.', s: 'Days per week.' },
    base: { t: 'DAILY', a: 'BASELINES.', s: 'Steps. Sleep.' },
    eq: { t: 'TRAINING', a: 'LOCATION.', s: 'Where it happens.' },
    ci: { t: 'NIGHTLY', a: 'REMINDER.', s: 'When to check in.' },
    wi: { t: 'FRIDAY', a: 'WEIGH-IN.', s: 'Pre-water. One number.' },
    gi: { t: 'GRATITUDE', a: 'LIBRARY.', s: 'Three surface nightly.' },
    fl: { t: 'STARTING', a: 'POINT.', s: 'Calibration only.' },
    rm: { t: '1RM', a: 'ESTIMATES.', s: 'Optional. Skippable.' },
    tf: { t: 'TRACK', a: 'FOOD?', s: 'Optional. Sets your targets.' },
    al: { t: 'TRACK', a: 'ALCOHOL?', s: 'Optional. Weekly nip limit.' },
  },
  editorial: {
    name: { t: 'INTRODUCTIONS', a: 'FIRST.', s: 'Tell us who is doing the work. We use names sparingly, only where they matter.' },
    age: { t: 'DATE OF', a: 'BIRTH.', s: 'A real date. We mark birthdays — the calibration is a side benefit.' },
    weight: { t: 'WHERE YOU ARE,', a: 'WHERE YOU GO.', s: 'Two data points. The line between them is the program. Friday mornings will draw it for us.' },
    days: { t: 'A WEEKLY', a: 'COMMITMENT.', s: 'Days you can defend, not days you wish for. The system trusts what you commit to.' },
    base: { t: 'THE TWO', a: 'BASELINES.', s: 'Step count and sleep duration — quiet inputs that govern almost everything else.' },
    eq: { t: 'EQUIPMENT', a: 'ON HAND.', s: 'What programs against what you actually have, available now. Switch any time you upgrade.' },
    ci: { t: 'EACH', a: 'EVENING.', s: 'Nine short prompts that take ninety seconds. The signal is the consistency.' },
    wi: { t: 'EACH', a: 'FRIDAY.', s: 'One reading per week, taken under the same conditions. Trend over noise.' },
    gi: { t: 'A WORKING', a: 'LIBRARY.', s: 'Specific, personal entries. The system surfaces three each night so the well never empties.' },
    fl: { t: 'A STARTING', a: 'POSITION.', s: 'No judgement, no flattery. The number that lets the program meet you accurately.' },
    rm: { t: 'STRENGTH', a: 'POSITIONS.', s: "Best estimates only. If you don't know yet, the first session will write them for us." },
    tf: { t: 'CALORIE', a: 'TRACKING?', s: 'Optional. Choose yes to set calorie and protein targets; no keeps weight tracking only.' },
    al: { t: 'ALCOHOL', a: 'TRACKING?', s: 'Optional. A weekly nip ceiling, daily detail, and alcohol-free-day streaks — or hide it entirely.' },
  },
};

function App() {
  const [tweak, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isMobile = useIsMobile();

  // Apply accent globally
  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', tweak.accent);
  }, [tweak.accent]);

  // ── Data model ────────────────────────────────────────────────────────────
  const SCHEMA = 3;
  const [data, setData] = React.useState(() => {
    try {
      const raw = localStorage.getItem('compound:onboarding');
      const savedSchema = Number(localStorage.getItem('compound:schema') || 0);
      if (raw && savedSchema === SCHEMA) return JSON.parse(raw);
    } catch (e) {}
    try {
      localStorage.setItem('compound:schema', String(SCHEMA));
      localStorage.removeItem('compound:step');
      localStorage.removeItem('compound:view');
    } catch (e) {}
    return {
      name: '',
      dob: '1992-04-15',
      weight: 82.5,
      weightGoal: 78,
      trainingDays: 3,
      workoutDays: [1, 3, 5],
      workoutTime: '17:00',
      workoutTimes: {}, // per-day overrides { dayIndex: 'HH:MM' } — empty = usual time everywhere
      stepGoal: 10000,
      sleepGoal: 7.5,
      equipment: null,
      gender: 'male',
      dietTracking: false,
      checkInTime: '21:00',
      weighInTime: '06:00',
      gratitude: [],
      fitnessLevel: null,
      lifts: {},
    };
  });

  const set = React.useCallback((patch) => {
    setData((d) => {
      const next = { ...d, ...patch };
      try { localStorage.setItem('compound:onboarding', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  // ── App view (onboarding vs main app) ─────────────────────────────────────
  const [view, setView] = React.useState(() => localStorage.getItem('compound:view') || 'onboarding');
  React.useEffect(() => { localStorage.setItem('compound:view', view); }, [view]);

  const [tab, setTab] = React.useState('home');
  // Workout tab internal nav: 'home' | 'new' | 'session' | 'past' | 'plan' | 'dashboard'
  const [workoutView, setWorkoutView] = React.useState('home');
  const [activeSession, setActiveSession] = React.useState(null);
  // Settings overlay
  const [showSettings, setShowSettings] = React.useState(false);
  const [showCalc, setShowCalc] = React.useState(false);
  const [nutTick, setNutTick] = React.useState(0);
  // Demo flags for Home variants (Tweak-controlled)
  const [demoFlags, setDemoFlags] = React.useState({
    wearableConnected: false,
    wearableDismissed: false,
    comeback: false,
    birthday: false,
    streakFreezes: 1,
  });
  const setDemoFlag = (k, v) => setDemoFlags((f) => ({ ...f, [k]: v }));

  // ── Onboarding step machine ──────────────────────────────────────────────
  const TOTAL_STEPS = 14;
  const [step, setStep] = React.useState(() => {
    const s = Number(localStorage.getItem('compound:step') || 0);
    return Number.isFinite(s) ? s : 0;
  });
  React.useEffect(() => { localStorage.setItem('compound:step', step); }, [step]);

  const [exited, setExited] = React.useState(false);
  const [savingExit, setSavingExit] = React.useState(false);
  const [onbCalc, setOnbCalc] = React.useState(false);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));
  const onSave = () => setSavingExit(true);

  const ctxFor = (idx, key) => {
    const t = TONE_HEADLINES[tweak.tone] || TONE_HEADLINES.coach;
    const h = t[key] || TONE_HEADLINES.coach[key];
    return {
      step: idx,
      total: TOTAL_STEPS,
      title: h.t,
      accentLine: h.a,
      sub: h.s,
      onSave,
    };
  };

  // ── Crossfade between onboarding steps ───────────────────────────────────
  const [renderStepIndex, setRenderStepIndex] = React.useState(step);
  const [fadeIn, setFadeIn] = React.useState(true);
  React.useEffect(() => {
    if (step !== renderStepIndex) {
      setFadeIn(false);
      const t = setTimeout(() => {
        setRenderStepIndex(step);
        setFadeIn(true);
      }, 140);
      return () => clearTimeout(t);
    }
  }, [step, renderStepIndex]);

  // Reset workout sub-view when switching away from the workout tab
  React.useEffect(() => {
    if (tab !== 'workout') setWorkoutView('home');
  }, [tab]);

  // ── Real check-in history (drives the live Home state) ───────────────────
  const [checkins, setCheckins] = React.useState(() => loadCheckins());

  // One-time migration: existing testers had a demo state persisted; flip them
  // to real/live data so the Life Score reflects actual check-ins.
  React.useEffect(() => {
    if (!localStorage.getItem('compound:livemigrated')) {
      setTweak('demoState', 'live');
      localStorage.setItem('compound:livemigrated', '1');
    }
    // eslint-disable-next-line
  }, []);

  // ── Demo state for Home (Tweak-controlled) ───────────────────────────────
  const demo = DEMO_STATES[tweak.demoState] || DEMO_STATES.midweek;
  const liveState = React.useMemo(() => deriveLiveState(data, checkins), [data, checkins, nutTick]);

  // ── Check-in modal ──────────────────────────────────────────────────────
  const [checkinOpen, setCheckinOpen] = React.useState(false);
  const [celebrate, setCelebrate] = React.useState(false);
  const [todayCompleted, setTodayCompleted] = React.useState(false);

  const openCheckin = () => setCheckinOpen(true);
  const closeCheckin = () => setCheckinOpen(false);
  const completeCheckin = (answers) => {
    setCheckinOpen(false);
    setCelebrate(true);
    setTodayCompleted(true);
    // Persist workout-day plan set in the Sunday review
    if (answers && Array.isArray(answers.workoutDays) && answers.workoutDays.length) {
      set({ workoutDays: answers.workoutDays });
    }
    // Persist real data so the Life Score + pillars compute from it.
    if (answers) {
      // Keep today's live nip tally in sync with the check-in.
      if (window.setNipsToday) window.setNipsToday(answers.afd ? 0 : (answers.nips || 0));
      // If the user raised the steps number at check-in, top the ledger up so
      // the rings + earned kcal agree with what they reported.
      try {
        const ledger = window.dayStepTotal ? window.dayStepTotal() : 0;
        if (typeof answers.steps === 'number' && answers.steps > ledger && window.addStepEntry) {
          window.addStepEntry({ kind: 'update', steps: answers.steps - ledger, source: 'checkin' });
        }
      } catch (e) {}
      const updated = recordCheckin(answers, data);
      setCheckins(updated);
    }
  };

  // reset todayCompleted whenever demo state switches
  React.useEffect(() => {
    setTodayCompleted(false);
  }, [tweak.demoState]);

  // ── Finish onboarding handler ────────────────────────────────────────────
  const finishOnboarding = () => {
    markJoined(); // record join date (once) for the mid-week-join grace period
    setView('app');
    setTab('home');
  };

  // ── Step renderer ────────────────────────────────────────────────────────
  const renderOnboardingStep = (idx) => {
    switch (idx) {
      case 0: return <ScreenWelcome onNext={next} />;
      case 1: return <ScreenName data={data} set={set} ctx={ctxFor(1, 'name')} onNext={next} onBack={back} />;
      case 2: return <ScreenAge data={data} set={set} ctx={ctxFor(2, 'age')} onNext={next} onBack={back} />;
      case 3: return <ScreenWeight data={data} set={set} ctx={ctxFor(3, 'weight')} onNext={next} onBack={back} />;
      case 4: return <ScreenTrainingDays data={data} set={set} ctx={ctxFor(4, 'days')} onNext={next} onBack={back} />;
      case 5: return <ScreenStepsSleep data={data} set={set} ctx={ctxFor(5, 'base')} onNext={next} onBack={back} />;
      case 6: return <ScreenEquipment data={data} set={set} ctx={ctxFor(6, 'eq')} onNext={next} onBack={back} />;
      case 7: return <ScreenCheckInTime data={data} set={set} ctx={ctxFor(7, 'ci')} onNext={next} onBack={back} />;
      case 8: return <ScreenWeighInTime data={data} set={set} ctx={ctxFor(8, 'wi')} onNext={next} onBack={back} />;
      case 9: return <ScreenGratitudeIntro ctx={ctxFor(9, 'gi')} onNext={next} onBack={back} />;
      case 10: return <ScreenGratitudeBuilder data={data} set={set} ctx={ctxFor(10, 'gi')} onNext={next} onBack={back} />;
      case 11: return <ScreenFitnessLevel data={data} set={set} ctx={ctxFor(11, 'fl')} onNext={next} onBack={back} />;
      case 12: return <Screen1RM data={data} set={set} ctx={ctxFor(12, 'rm')} onNext={next} onBack={back} />;
      case 13:
        if (onbCalc) {
          return (
            <MacroCalculator
              user={data}
              onBack={() => setOnbCalc(false)}
              onDone={() => { set({ dietTracking: true }); setOnbCalc(false); next(); }}
            />
          );
        }
        return (
          <ScreenTrackFood
            data={data} set={set} ctx={ctxFor(13, 'tf')}
            onYes={() => setOnbCalc(true)}
            onNo={() => { set({ dietTracking: false }); next(); }}
            onBack={back}
          />
        );
      case 14: return <ScreenAlcohol data={data} set={set} ctx={ctxFor(14, 'al')} onNext={next} onBack={back} />;
      default: return <ScreenComplete data={data} onFinish={finishOnboarding} />;
    }
  };

  // ── Tab content ──────────────────────────────────────────────────────────
  const renderTab = () => {
    const isLive = tweak.demoState === 'live';
    const stateForHome = isLive
      ? liveState
      : { ...demo, todayCheckinDone: todayCompleted || demo.todayCheckinDone };
    if (tab === 'home') {
      return (
        <HomeScreen
          user={data}
          set={set}
          state={stateForHome}
          onOpenCheckin={openCheckin}
          onGoTo={(t) => setTab(t)}
          onOpenSettings={() => setShowSettings(true)}
          onChanged={() => setNutTick((x) => x + 1)}
          onRecalc={() => setShowCalc(true)}
          demoFlags={demoFlags}
          setDemoFlag={setDemoFlag}
        />
      );
    }
    if (tab === 'workout') {
      const navWorkout = (v) => setWorkoutView(v);
      if (workoutView === 'home') {
        return (
          <WorkoutHome
            user={data}
            onNav={(v) => {
              if (v === 'session' && !activeSession) return;
              setWorkoutView(v);
            }}
            hasInProgress={!!activeSession}
            onChanged={() => setNutTick((x) => x + 1)}
          />
        );
      }
      if (workoutView === 'new') {
        return (
          <NewWorkoutFlow
            user={data}
            onBack={() => setWorkoutView('home')}
            onStart={({ config, session }) => {
              setActiveSession({ config, session });
              setWorkoutView('session');
            }}
          />
        );
      }
      if (workoutView === 'session' && activeSession) {
        return (
          <WorkoutSession
            session={activeSession.session}
            config={activeSession.config}
            onExit={(result) => {
              if (result.resume) {
                setActiveSession((a) => ({ ...a, session: result.exercises }));
              } else {
                setActiveSession(null);
              }
              setWorkoutView('home');
            }}
            onComplete={() => {
              setActiveSession(null);
              setWorkoutView('home');
              setNutTick((x) => x + 1); // recompute liveState so "This Week" reflects the just-logged session
            }}
          />
        );
      }
      if (workoutView === 'past') {
        return <PastWorkouts onBack={() => setWorkoutView('home')} />;
      }
      if (workoutView === 'saved') {
        return (
          <SavedWorkoutsScreen
            onBack={() => setWorkoutView('home')}
            onStart={(r) => {
              const cfg = r.config || { location: data.equipment || 'gym', duration: r.duration || 30, groups: r.groups || [], preFeel: 0 };
              const session = (window.generateSession ? window.generateSession(cfg) : []);
              setActiveSession({ config: cfg, session });
              setWorkoutView('session');
            }}
          />
        );
      }
      if (workoutView === 'plan') {
        return <WeeklyPlan user={data} onBack={() => setWorkoutView('home')} onStart={() => setWorkoutView('new')} />;
      }
      if (workoutView === 'dashboard') {
        return <WorkoutDashboard onBack={() => setWorkoutView('home')} />;
      }
      return <WorkoutHome user={data} onNav={navWorkout} hasInProgress={!!activeSession} />;
    }
    if (tab === 'nutrition') {
      return (
        <NutritionTab
          user={data}
          dietTracking={!!data.dietTracking}
          onChanged={() => setNutTick((x) => x + 1)}
          onSetupTargets={() => setShowCalc(true)}
        />
      );
    }
    if (tab === 'reports') {
      return <ReportsScreen user={data} />;
    }
    return null;
  };

  // ── Density: small font-size scale knob ────────────────────────────────────
  const densityStyle = {
    compact: { fontSize: 13 },
    regular: { fontSize: 14 },
    comfy: { fontSize: 15 },
  }[tweak.density] || { fontSize: 14 };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 0%, #1a1410 0%, #0a0a0c 55%, #050507 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        ...densityStyle,
      }}
    >
      {!isMobile && <BackdropPattern />}
      <ResponsiveFrame mobile={isMobile}>
        {view === 'onboarding' ? (
          <div
            style={{
              position: 'absolute', inset: 0,
              opacity: fadeIn ? 1 : 0,
              transform: fadeIn ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity .18s ease, transform .18s ease',
            }}
          >
            {renderOnboardingStep(renderStepIndex)}
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              {renderTab()}
              {tab === 'home' && (
                <AddButton
                  dietTracking={!!data.dietTracking}
                  alcohol={alcoholOn(data)}
                  onChanged={() => setNutTick((x) => x + 1)}
                  onGoNutrition={() => setTab('nutrition')}
                />
              )}
            </div>
            <TabBar active={tab} onChange={setTab} />
          </div>
        )}

        {tweak.grain && <GrainOverlay opacity={0.08} />}

        {view === 'onboarding' && exited && <ExitedScreen onReturn={() => setExited(false)} />}
        {view === 'onboarding' && savingExit && !exited && (
          <SaveExitModal
            onResume={() => setSavingExit(false)}
            onExit={() => { setSavingExit(false); setExited(true); }}
          />
        )}

        {view === 'app' && (
          <CheckinModal
            open={checkinOpen}
            onClose={closeCheckin}
            onComplete={completeCheckin}
            gratitudeLibrary={data.gratitude || []}
            user={data}
            initialAnswers={(() => {
              const today = isoDate(new Date());
              const e = checkins.find((h) => h.date === today);
              return e ? e.answers : null;
            })()}
          />
        )}
        {view === 'app' && celebrate && (
          <CheckinCelebration onClose={() => setCelebrate(false)} />
        )}

        {/* Settings overlay */}
        {view === 'app' && showSettings && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 140 }}>
            <SettingsScreen
              user={data}
              set={set}
              onRecalc={() => { setShowSettings(false); setShowCalc(true); }}
              onClose={() => setShowSettings(false)}
              onReset={() => { setShowSettings(false); setView('onboarding'); setStep(0); }}
            />
          </div>
        )}
      </ResponsiveFrame>

      {/* Macro calculator overlay (Settings setup / recalculate) */}
      {view === 'app' && showCalc && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 160 }}>
          <MacroCalculator
            user={data}
            onBack={() => setShowCalc(false)}
            onDone={(t) => { set({ dietTracking: true }); setShowCalc(false); setNutTick((x) => x + 1); }}
          />
        </div>
      )}

      <SideMeta data={data} step={step} view={view} tab={tab} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Accent" />
        <TweakColor
          label="Accent color"
          value={tweak.accent}
          options={['#F2A30F', '#E8513F', '#7BB661', '#7CA8E0', '#C9C7BE']}
          onChange={(v) => setTweak('accent', v)}
        />
        <TweakSection label="Layout" />
        <TweakRadio
          label="Density"
          value={tweak.density}
          options={['compact', 'regular', 'comfy']}
          onChange={(v) => setTweak('density', v)}
        />
        <TweakSection label="Voice" />
        <TweakRadio
          label="Copy tone"
          value={tweak.tone}
          options={['quiet', 'coach', 'editorial']}
          onChange={(v) => setTweak('tone', v)}
        />
        <TweakSection label="Texture" />
        <TweakToggle label="Background grain" value={tweak.grain} onChange={(v) => setTweak('grain', v)} />

        <TweakSection label="View" />
        <TweakRadio
          label="Mode"
          value={view}
          options={['onboarding', 'app']}
          onChange={(v) => setView(v)}
        />
        {view === 'app' && (
          <TweakSelect
            label="Demo day state"
            value={tweak.demoState}
            options={['live', 'fresh', 'midweek', 'strong']}
            onChange={(v) => setTweak('demoState', v)}
          />
        )}

        {view === 'app' && (
          <>
            <TweakSection label="Home variants" />
            <TweakToggle label="Birthday today" value={demoFlags.birthday} onChange={(v) => setDemoFlag('birthday', v)} />
            <TweakToggle label="Comeback (5 days missed)" value={demoFlags.comeback} onChange={(v) => setDemoFlag('comeback', v)} />
            <TweakToggle label="Hide wearable banner" value={demoFlags.wearableDismissed} onChange={(v) => setDemoFlag('wearableDismissed', v)} />
          </>
        )}

        <TweakSection label="Navigation" />
        {view === 'onboarding' ? (
          <>
            <TweakButton label="Jump to completion" onClick={() => setStep(13)} secondary />
            <TweakButton label="Restart onboarding" onClick={() => setStep(0)} secondary />
          </>
        ) : (
          <>
            <TweakButton label="Open Settings" onClick={() => setShowSettings(true)} />
            <TweakButton label="Open check-in modal" onClick={() => setCheckinOpen(true)} secondary />
            <TweakButton label="Reset today's check-in" onClick={() => {
              setTodayCompleted(false);
              const today = isoDate(new Date());
              const next = loadCheckins().filter((h) => h.date !== today);
              saveCheckins(next);
              setCheckins(next);
            }} secondary />
            <TweakButton label="Clear all check-in data" onClick={() => {
              saveCheckins([]);
              setCheckins([]);
              setTodayCompleted(false);
            }} secondary />
            <TweakButton label="Back to onboarding" onClick={() => setView('onboarding')} secondary />
          </>
        )}
      </TweaksPanel>

      <InstallPrompt />
    </div>
  );
}

// ── Backdrop ────────────────────────────────────────────────────────────────
function BackdropPattern() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        background:
          'radial-gradient(ellipse at 18% 12%, rgba(242,163,15,.06), transparent 40%),' +
          'radial-gradient(ellipse at 82% 88%, rgba(242,163,15,.04), transparent 45%)',
        zIndex: 0,
      }}
    />
  );
}

// ── Side meta (outside the frame, desktop only) ─────────────────────────────
function SideMeta({ data, step, view, tab }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: 32,
        top: '50%',
        transform: 'translateY(-50%)',
        fontFamily: 'JetBrains Mono, monospace',
        color: 'rgba(242,241,236,.42)',
        fontSize: 10,
        letterSpacing: 2,
        lineHeight: 1.8,
        zIndex: 1,
        display: 'none',
      }}
      className="side-meta"
    >
      <div style={{ color: '#F2A30F', marginBottom: 14 }}>◆ COMPOUND</div>
      <div>{view === 'onboarding' ? `ONBOARDING / STEP ${String(step).padStart(2, '0')}` : `APP / ${tab.toUpperCase()}`}</div>
      <div>NAME: {data.name || '—'}</div>
      <div>TRAIN: {data.trainingDays}×/WK</div>
      <div>GOAL: {data.weightGoal}KG</div>
    </div>
  );
}

// One-time "clear today" — wipes only TODAY's check-in + weigh-in so the app
// opens as if nothing has been logged yet. History is preserved.
(function () {
  var TOKEN = 'cleartoday-woke-230pm';
  try {
    if (localStorage.getItem('compound:cleartoken') !== TOKEN) {
      var d = new Date();
      var today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      // Array stores keyed by entry.date
      ['compound:checkins', 'compound:weighins'].forEach(function (k) {
        var arr = JSON.parse(localStorage.getItem(k) || '[]').filter(function (e) { return e.date !== today; });
        localStorage.setItem(k, JSON.stringify(arr));
      });
      // Object stores keyed by date
      ['compound:todostate', 'compound:food', 'compound:nipsToday', 'compound:alcoholKcal'].forEach(function (k) {
        var obj = JSON.parse(localStorage.getItem(k) || '{}');
        delete obj[today];
        localStorage.setItem(k, JSON.stringify(obj));
      });
      localStorage.removeItem('compound:workoutWeek');
      localStorage.setItem('compound:cleartoken', TOKEN);
    }
  } catch (e) {}
})();

export { App, BackdropPattern, SideMeta, TONE_HEADLINES, TWEAK_DEFAULTS };
