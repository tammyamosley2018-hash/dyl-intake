// Results page wording (DYL Terrain Model). Edit words here; scoring lives in intake-data.js.
window.COPY = {
  consultUrl: "https://calendly.com/quillaxiberry/45-minute-health-assessment-free-dyl",
  headline: "Your body has been talking. Here's what it's saying.",
  opening: [
    "Most people never notice the first stage. Long before anything shows up on a lab, the nerve energy of a gland or organ starts to wane. We call it <strong>enervation</strong>. Nothing hurts yet. You're just tired in a way rest doesn't fix.",
    "Your answers show where your body is quietly running low, and where it has started asking for help."
  ],
  topHeading: "Where your body is asking for attention",
  watchHeading: "Also worth watching",
  verdict: "These are <em>signals</em>, not verdicts. Your body is not broken. It's responding intelligently to what it has been carrying.",
  consult: "Your results are a starting point. In your free 45-minute consult, we'll walk through what each signal means for <em>your</em> body, and what your terrain needs first.",
  consultButton: "Book my free consult",

  // Client-facing stages 1-4 of the seven-stage Terrain Model. Stages 5-7 are assessed in the consult only.
  stages: [
    null,
    { name: "Enervation", line: "The energy in this system is starting to wane. It's subtle, and it's the easiest stage to turn around." },
    { name: "Toxemia", line: "Waste is building here faster than your body can clear it. The signals are getting louder." },
    { name: "Irritation", line: "This system is being irritated by what it's carrying, and your body is starting to push back." },
    { name: "Inflammation", line: "Your body is actively fighting to clear this system. The heat you feel is effort, not failure." }
  ],

  systems: {
    thyroid: {
      what: "Sets your body's pace: temperature, metabolism, and how fast energy moves through you.",
      saying: "Cold hands and feet, a hard time getting warm, weight that comes on easy and won't leave, low energy, headaches. Your internal thermostat is running low."
    },
    parathyroid: {
      what: "Governs how your body uses calcium: bones, nails, veins, muscles, and nerves.",
      saying: "Weak nails, cramping (including period cramps), spider or varicose veins, bruising easily, low mood. Calcium may be present but not being put where it belongs."
    },
    pancreas: {
      what: "Supplies the enzymes that break your food down so your cells can actually use it.",
      saying: "Gas after eating, food that sits in your stomach, reflux, undigested food, trouble keeping weight on. You may be eating well and still not receiving it."
    },
    adrenals: {
      what: "Your stress and energy reserve. They carry you through every deadline, emergency, and sleepless night.",
      saying: "Anxiety, restless legs, poor sleep, fatigue, ringing ears, shortness of breath, \"itis\" inflammation. You may have been running on reserve for a long time."
    },
    female: {
      what: "Your cycle is a monthly report card on your whole terrain, not just your reproductive organs.",
      saying: "Irregular cycles, heavy bleeding, sore breasts, changes in sex drive. Your cycle is carrying a message about what your body is holding."
    },
    male: {
      what: "Reflects circulation, hormonal strength, and how well your lower body is draining.",
      saying: "Frequent night urination, changes in drive or performance. These are circulation and drainage signals, not something to be embarrassed about."
    },
    gi: {
      what: "Where your body receives what it needs and lets go of what it doesn't.",
      saying: "Coated tongue in the morning, gas, constipation or loose stools. What you release (or don't) tells us how your terrain is flowing."
    },
    liver: {
      what: "Your body's filter and fat processor. They clean the blood and break down the fats that carry your hormones.",
      saying: "Trouble with fats or dairy, bloating, pain under the right ribs or mid-back after eating, brown \"liver\" spots, pale stools. Your filter may be backed up."
    },
    heart: {
      what: "Moves life through you. Every cell depends on this flow.",
      saying: "Chest pressure, prickly pains, pressure readings running high. Your circulation is working harder than it should have to."
    },
    skin: {
      what: "Your third kidney. When the inner exits are backed up, the body pushes out through the skin.",
      saying: "Rashes, blemishes, dryness, dandruff. Your skin is showing you what the inside is trying to release."
    },
    lymph: {
      what: "Your body's cleanup and drainage system. Every cell empties its waste into the lymph.",
      saying: "Sinus trouble, morning eye mucus, pimples or cysts, brain fog, early gray hair, hair loss. Your drainage system may be congested, and congestion shows up everywhere."
    },
    kidneys: {
      what: "Filter and release the acids and waste your body produces every day.",
      saying: "Puffy eyes in the morning, lower-back cramping, burning or frequent urination. Your body's main exit for waste may be under-filtering."
    },
    lungs: {
      what: "Take in life and release waste with every breath.",
      saying: "Difficulty taking a deep breath or pain when breathing. Your breath is showing you where the body is guarding."
    }
  }
};
