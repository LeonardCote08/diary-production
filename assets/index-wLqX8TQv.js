/**
* ios-haptics v0.1.2
* tijn.dev
* @license MIT
**/
function _haptic() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(50);
      return;
    }
    const labelEl = document.createElement("label");
    labelEl.ariaHidden = "true";
    labelEl.style.display = "none";
    const inputEl = document.createElement("input");
    inputEl.type = "checkbox";
    inputEl.setAttribute("switch", "");
    labelEl.appendChild(inputEl);
    document.head.appendChild(labelEl);
    labelEl.click();
    document.head.removeChild(labelEl);
  } catch {
  }
}
_haptic.confirm = () => {
  if (navigator.vibrate) {
    navigator.vibrate([
      50,
      70,
      50
    ]);
    return;
  }
  _haptic();
  setTimeout(() => _haptic(), 120);
};
_haptic.error = () => {
  if (navigator.vibrate) {
    navigator.vibrate([
      50,
      70,
      50,
      70,
      50
    ]);
    return;
  }
  _haptic();
  setTimeout(() => _haptic(), 120);
  setTimeout(() => _haptic(), 240);
};
const __haptic = _haptic;
export {
  __haptic as haptic
};
