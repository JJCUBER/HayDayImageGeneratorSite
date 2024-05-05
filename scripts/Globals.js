let itemsPerRow = 8;
let textListSeparatorSelectedRadio = 0;

let itemsPerRowSlider, itemsPerRowLabel, itemNameInput, itemQuantityInput, itemPriceOrMultiplierInput, itemTable;
let bottomText, screenshotRegion, screenshotPriceHolder;
let settingsOverlay, abbreviationMappingTable, bottomTextSettingInput, textListSeparatorRadios, textListCustomSeparatorInput, textListSeparatorCustomRadio, textListFormatInput, priceCalculationItemInput, showPriceInScreenshotCheckBox, showTotalInNormalModeCheckBox, hidePriceOrMultiplierCheckBox, defaultQuantityInput, defaultPriceOrMultiplierInput, refocusNameOnSubmitCheckBox, ignoreLocaleCheckBox/*, reduceAnimationsCheckBox*/;
let priceCalculationModeStateSpan;
let disableInPriceCalculationModeElems, disableOutsidePriceCalculationModeElems;
let equationVisibilityStateSpan, unselectedItemsVisibilityStateSpan;
let shouldHideUnselectedItems = false;
let totalSelectedPriceArea, totalSelectedPriceHolder, totalSelectedPriceMessageHolder, totalSelectedPriceEquationHolder;
let coinImageUrl;
let priceCalculationItem;
let priceCalculationModeSelectionInfo;
let changelogOverlay, failedCopyOverlay, contactOverlay;
let copyImageLoadingWheel;
let shouldShowTotalInNormalMode; // FIXME -- I'm starting to think more and more that this shouldn't be a variable, since the state is already completely coupled with the checkbox; adding this variable just prevents a get...() call that queries the checkbox with jquery to check if it's checked
let shouldHidePriceOrMultiplier;
let defaultQuantity, defaultPriceOrMultiplier;
let shouldRefocusNameOnSubmit, shouldIgnoreLocale;

let itemNameFuzzyMatchesHolder, priceCalculationItemFuzzyMatchesHolder;


let preparedItemNames;


let items = new Map();

let abbreviationMapping = new Map([
    ["tnt", "tnt barrel"],
    ["dyn", "dynamite"],
    ["wsugar", "white sugar"],
    ["bsugar", "brown sugar"],
    ["bpop", "buttered popcorn"],
    ["cpop", "cherry popsicle"],
    ["bmuff", "blackberry muffin"],
    ["rmuff", "raspberry muffin"],
    ["vice", "vanilla ice cream"],
    ["sice", "strawberry ice cream"],
    ["gbar", "gold bar"],
    ["sbar", "silver bar"],
    ["pbar", "platinum bar"],
    ["rcoal", "refined coal"],
    ["gcheese", "goat cheese"]
]);
let isActivelyCopyingImage = false;

