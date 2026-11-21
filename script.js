// ========== SETTINGS ==========

// How long the count-up lasts. JavaScript time is in milliseconds (1000 ms = 1 s).
const DURATION = 2000;

// ========== READ THE PAGE ==========

// Find the three numbers on the page (80K, 803K, 1.4K).
// querySelectorAll returns a list of all the elements with the class "stat__value".
const values = document.querySelectorAll(".stat__value");

// Ask the browser if the visitor turned on "reduce motion" in their system settings.
// .matches is true or false.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Build one small object per number, with everything we need to animate it.
// The list from querySelectorAll is not a real array, so Array.from turns it into one
// (that lets us use .map). .map goes through each item and returns a new array.
const stats = Array.from(values).map((element) => {
  // The final text written in the HTML, for example "1.4K".
  // .trim() removes spaces or line breaks around the text.
  const finalText = element.textContent.trim();

  // parseFloat reads the number at the start of a text and stops at the first
  // character that is not part of a number: "1.4K" -> 1.4, "803K" -> 803.
  const target = parseFloat(finalText);

  // How many digits come after the dot in the final value:
  // "1.4K" -> 1, "80K" -> 0. If there is a dot, we cut the text at the dot
  // ("1.4K" -> ["1", "4K"]), take the part after it ("4K"), remove everything
  // that is not a digit (the "K"), and count what is left.
  const decimals = finalText.includes(".") ? finalText.split(".")[1].replace(/\D/g, "").length : 0;

  // Shorthand for { element: element, finalText: finalText, ... }
  return { element, finalText, target, decimals };
});

// ========== EASING ==========

// An "easing" function changes the speed of the animation.
// t is the progress of the animation: 0 = just started, 1 = finished.
// This one is "ease-out": the result moves fast at first, then slows down near the end.
// Example: at t = 0.5 (half of the time), the result is 0.875, so the number
// is already at 87.5% of its final value.
function easeOut(t) {
  return 1 - Math.pow(1 - t, 3); // Math.pow(x, 3) means x * x * x
}

// ========== ANIMATION ==========

// animate remembers the moment the animation started (startTime),
// and returns the function (step) that the browser will call on every frame.
// This pattern is called a closure: step can still use startTime later.
function animate(startTime) {
  // "now" is the current time that the browser gives us on every frame.
  return function step(now) {
    // How much of the 2 seconds has passed, from 0 to 1.
    // Math.min makes sure it never goes above 1, even if the last frame is a bit late.
    const t = Math.min((now - startTime) / DURATION, 1);

    // Update the three numbers on screen.
    stats.forEach((stat) => {
      if (t === 1) {
        // Finished: put back the exact original text (for example "1.4K").
        // This avoids tiny rounding differences at the end.
        stat.element.textContent = stat.finalText;
      } else {
        // Still counting: final value * eased progress, for example 80 * 0.875 = 70.
        // toFixed keeps the right number of decimals and returns a text ("70", "0.7").
        // Then we add the "K" back.
        stat.element.textContent = (stat.target * easeOut(t)).toFixed(stat.decimals) + "K";
      }
    });

    // Not finished yet? Ask the browser to call step again for the next frame.
    if (t < 1) {
      requestAnimationFrame(step);
    }
  };
}

// ========== START ==========

// Only animate if the visitor did NOT ask for reduced motion.
// If they did, we do nothing, so the HTML keeps showing the final values.
if (!reducedMotion) {
  // Show "0K" (or "0.0K" for the number with a decimal) before the first frame,
  // so we do not see the final value flash for a moment.
  stats.forEach((stat) => {
    stat.element.textContent = (0).toFixed(stat.decimals) + "K";
  });

  // requestAnimationFrame calls our function just before the browser draws the next
  // frame, and gives it the current time ("now").
  // The first requestAnimationFrame gives us the start time (now). We then start the
  // animation from the next frame, so the browser has time to draw the "0K" values first.
  requestAnimationFrame((now) => requestAnimationFrame(animate(now)));
}
