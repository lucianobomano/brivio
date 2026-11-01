/**
 * Room at the top of the editor taken by the top bar (Preview / Edit / Componentes / Asset library and the
 * icons on its right): it sits 16px from the top and is ~52px tall. Context bars and panels never go above
 * this line, so they never cover the top bar.
 */
export const TOP_BAR_CLEARANCE = 84

/** collisionPadding for Radix popovers (context bars, settings panels): flip / shift away from the top bar */
export const EDITOR_COLLISION_PADDING = { top: TOP_BAR_CLEARANCE, right: 10, bottom: 10, left: 10 }
