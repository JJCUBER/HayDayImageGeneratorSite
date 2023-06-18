const changelog = new Map([
    ["v2.7", `Features:
- Upon your first time ever using the site, the items per row count now defaults to whatever will comfortably fit on screen for the user (up to a max of 8 DEFAULT); this will not affect you if you have used the site before
- Clicking the bottom text now (in addition to already focusing the setting to modify it) additionally scrolls to the setting to ensure that it is on screen (especially on mobile)

UI Changes:
- Made buttons and inputs look the same across all platforms
- Added a submit button for adding/modifying items (since many people were confused by simply pressing enter to submit; that way still works, this is just another way of submitting the changes)
- Made formatting look the same across all platforms as well
- Made the UI/page scale up to the width of phone screens so that it isn't so tiny
- Decreased the size of input boxes (and made it relative to the default font size being used, which is dependent on the device; iOS devices are forced to 16px, since that's what iOS requires for font size in order to not zoom in when focusing an input)
- Made selecting a fuzzy search result/match not highlight the new text (instead putting the cursor at the end of the word(s))
- Buttons that get wrapped to the next line (most noticeable on smaller screens, i.e. mobile phones) now have a gap between them, making it look less crowded/bad
- Improved the layout/styling of the settings overlay (input boxes now fit properly to the dimensions of the overlay dependant on how large your device is, the abbreviation mappings table can't take up too much of the screen anymore which allows for easily scrolling to the rest of the settings on mobile)
- Ensured that the contact overlay always has a reasonable width (since it is so small)

Bug Fixes:
- Fixed issues with the bottom text in the generated image on android

Misc:
- minor code improvements`],
    ["v2.6", `Major Fix:
- Copy image button (finally) works on mobile!  It should automatically copy the image just by clicking the button.  If it does not (if you still get a popup saying copy failed), please click the "Contact" button and let me know, since that shouldn't be happening.`],
    ["v2.5", `Features:
- Added a "Contact" overlay which has a link to the discord server I created for this tool, along with a link for creating an issue on GitHub

UI Changes:
- Added a slight shadow/outline to item images, along with changing the color when hovering (this gives a bit more contrast to items with a similar color to the background)
- Made the minimum width for the box portion of overlays be 20% (that way, it wouldn't ever be too small)

Misc:
- A fair bit of code cleanup`],
    ["v2.4.2", `UI Changes:
- Made the "image failed to copy" overlay always have a width of 80% (the image would be quite tiny on some devices otherwise)`],
    ["v2.4.1", `UI Changes:
- Made generated image in (failed to copy) overlay rescale in size to properly fit on screen

Bug Fixes:
- Added animal byproducts to the search functionality (they were previously missing, though those items could still be added if you typed the full name out)`],
    ["v2.4", `Features:
- Added all the names of tools and expansion materials to the fuzzy searching list (they were always addable, but they previously weren't part of the list of terms to show as matches)
- Made a blacklist to the fuzzy search list for some item names which aren't sellable (such as lures and feed); you can still add the items by typing the full names if you really want to, though

UI Changes:
- Made the name input no longer get focused when clicking on the image of an item while in price calculation mode (this makes it less annoying to select/deselect items on mobile, since the name input will no longer be focused with every click)
- Made the fuzzy matches list get cleared after submitting an item

Bug Fixes:
- Fixed an obscure bug where typing 1-9,0 to select a fuzzy match would still add an event to the document, where the first click anywhere would refocus the name input`],
    ["v2.3.2", `UI Changes:
- When specifying a custom price or quantity for a selected item (in price calculation mode), the original value now gets dimmed out to make it more clear.
- Outlines and shadows now look slightly different (look at Bug Fixes for more info)
- Made the 'X'/close button in overlays stay on screen when scrolling (before it could be scrolled away from).

Bug Fixes:
- Changed how I do outlines and shadows to resolve newer iOS devices not showing said outlines and shadows in the generated image.`],
    ["v2.3.1", `Bug Fixes:
- Fixed images not properly loading in screenshot for iOS devices (this might be an issue for Macs as well when using safari, but I have no way of testing it; let me know if you run into this issue)
- Fixed outlines not showing in screenshot for iOS devices

UI Changes:
- Changed the color and outlines of price/multiplier and quantity labels (they should be more readable now)
- Made the list of matches fade in when there previously weren't any/when the input is focused (it fades in only when going from a state of being empty -> non-empty)

Misc:
- Cleaned up and organized css`],
    ["v2.3", `Features:
- Added toggle to hide unselected items (when in price calculation mode)
- Added a (green) notification when something got successfully copied (image/text of item list), coupled with a nice animation (more about the animation in UI Changes)
- Added a (red) notification when something fails to get copied (same animation as ^)
- Made clicking the small border around any of the inputs in the abbreviation mappings table (within settings) focus the input itself (in case you are unlucky enough to manage to click just outside of the input)
- Added a loading wheel animation while in the process of generating and copying the image of the grid of items
- Added an overlay which shows when the image is successfully generated but fails to copy to the clipboard (usually due to the page not having focus or the user being on a mobile device); this overlay presents the generated image, allowing the user to still copy/save it by right clicking/long-pressing (depending on what device they are using)

UI Changes:
- Disabled fuzzy search/matches popup while in price calculation mode (there wasn't any need for it to be popping up while selecting/deselecting items)
- Animations and transitions GALORE (mentioned throughout the remaining bullet points)
- Made notifications fade and slide in/out (they slide in/out from the top of the screen and stay there for a few seconds)
- Added smooth transitions/animations to the outlines of items in the table/list, price/quantity labels, and more (primarily relating to the color of the outlines)
- Improved the look of the outlines of elements (such as buttons and inputs)
- Made all toggle-related buttons have a red outline while "activated" (only when they are not disabled; for example, if showing the equation for the total price is enabled, but price calculation mode is not currently active, the button for enabling the showing of the equation won't have a red outline)
- Made overlays fade in when opened
- Made price calculation mode's tooltip fade in when enabling said mode
- Added some nice animations when modifying the item table in any way (adding items, removing items, editing items, resizing the table) to make it feel more "alive"/"responsive"
- Animation when focusing any input field (of the background color turning yellow); this helps with seeing what got focused and/or whether something is focused
- Added a little animation when clicking buttons (makes it feel more responsive and makes it clear that the button is actually being clicked)
- Added transition when buttons change state between being enabled <-> disabled (fades in/out instead of instantly changing)
- The entire total price calculation area fades in when enabled
- Whenever a warning/error message appears in the price calculation area, it will fade in (if there wasn't previously a warning/error on screen)
- Same as ^ for the equation for the total price
- Reordered the price calculation area slightly to have the message at the very bottom instead of before the equation
- Made the price calculation area's message transition/animate the change in color when going between warning <-> error
- Made the item table not shift around slightly when opening/closing overlays (settings, changelog, etc.) in the (probably rare) case where you have bottom text long enough to wrap around
- Made the items per row slider more vertically centered

Misc:
- Some code cleanup`],
    ["v2.2", `Features:
- Added fuzzy searching/matching for item names, making it much easier and faster to input the name of a given item.  Fuzzy searching basically allows you to skip letters and even have them partially out of order, while still finding the "best" matches.  Give it a try, and you will see what I mean (it also shows visually what part of the matched terms it is "selecting").
- In addition to clicking from the list of matches, you can input 1-9, 0 while typing a name to select that numbered match to fill in.

UI Changes:
- The grid now centers relative to the bottom text when the bottom text is wider than the grid.  (I initially made the grid just center completely on the page, but that would cause items to shift to the left/right visually when adding/removing items from the first row, which would be a bit annoying.)

Misc:
- Split the js file into multiple separate purposeful files/file names.  (Also wrote a script which compiles all the js files into a single one for actual use by github pages.)`],
    ["v2.1", `Features:
- Popups now close when you click "out of them" (when you click the semi-transparent background); this makes it easier to exit without scrolling back up to the x button (also working on getting that x button to stay put at some point)

UI Changes:
- Changed color of outline when hovering over selected items (to make it easier to tell when you are hovering over something that is also selected)
- Made price/multiplier labels be pure black with no outline (more readable)

Misc.:
- Removed use of some deprecated jQuery functions`],
    ["v2.0", `MAJOR (Overview):
- A Price Calculation Mode was added, which supports a ton of stuff (multiple ways to quickly select/deselect individual/ranges of items, custom quantities and prices/multipliers for selection mode, automatic price calculation of selected items, a way to see the equation used for the calculation, and more)
- improved UI (in the way of making it clear what is clickable, what is happening, etc.)
- setting additions and improvements (allowing more customizability)

All Features Added:
- Added fetching items' max prices (retroactively applies to items that were added in an older version)
- Added support for multiline bottom text
- Added parsing and calculating of item's total price
- Added setting for custom text list format (it supports the special variables {{name}}, {{quantity}}, and {{price}}; it also supports being multiline)
- Added a price calculation mode (which support calculating total price, along with selecting items, custom quantities, custom prices/multipliers, etc.)
- Added clear selection button
- Selection state of items is maintained even outside of price calculation mode until the site is reloaded (which allows for going out of price calculation mode, adding an item, then going back in without losing your selections)
- Added select all button
- Added total price calculation for selected items (in coins and items, such as rings)
- Added setting for what item to use for price calculation (for example, chaps or dresses in place of rings)
- Added custom quantity and price for selected items
- Added button to reset/wipe custom quantity and prices
- Added support for starting a quantity of an item with an operator (such as +,-,*,/) to scale the current quantity accordingly (if the item isn't already added, the quantity will be calculated like normal, which allows for putting some equation like -2+5*3^4/...).  If in price calculation mode and you have a custom quantity, that value will be used for the calculation instead.
- Added a button to toggle visibility of the equation used for calculating the total price in price calculation mode
- Made empty custom quantity/multiplier default back to the normal (full) value
- Empty quantity now gets treated as a 0 (now you can simply wipe out the quantity field of an item to remove it without having to type 0, -1, etc.)
- Made custom quantity reset to normal if the normal value gets updated (outside of price calculation mode) to go from being > the custom value to being <= the custom value (keeps the custom quantity upper-bounded by the normal quantity if it was previously upper-bounded by said normal quantity)
- Added subtract selected quantities button (custom quantities get subtracted from the normal quantity; any item without a custom quantity or which falls beneath a quantity of 1 gets automatically removed)
- Added delete selected button
- Added multiple ways to select items in price calculation mode: Click = individual toggle, Shift+Click = range additive, Alt+Click = range subtractive, Ctrl+Click = range toggle (invert)

UI Changes:
- Made hovering over quantity or price/multiplier highlight it with a different color (showing that it's clickable)
- Made all buttons show the cursor pointer when hovered over
- Improved spacing between buttons
- Made name input turn red when an invalid item name is submitted
- Added warning and error information for price calculation to the UI (warnings for items without a price/multiplier getting defaulted, and errors for items that aren't sellable, such as cow or pig)
- Added a way to see the equation used for calculating the total price in price calculation mode
- Added blurb describing the keybinds of price calculation mode (only shows when in price calculation mode); "Click = individual toggle, Shift+Click = range additive, Alt+Click = range subtractive, Ctrl+Click = range toggle (invert)"
- Made the total price update along the way while item prices are being loaded (only relevant if you have items saved from before this version which need to have their prices fetched)
- Added a changelog (it pops up automatically when first launching the site ONLY when it detects that the site has updated to a new version since the last time you opened it; it won't keep pestering you)

Bug Fixes:
- Fixed empty price/multipliers still including the coin image by itself
- Fixed settings background not covering the whole screen when scrolled (also fixed being able to scroll the main page while in the setting popup)
- Fixed spamming of copy image to clipboard button sometimes causing temporary repeated watermarks
- Fixed having a long bottom text with only 1-2 items cutting off the text in the generated screenshot`],
    ["v1.5.2", `Fixed:
- item name "Frutti di Mare Pizza" not working

Notes:
- I have some major features being worked on right now (which aren't ready to commit to here yet), but I wanted to get this fix out quickly.
- To my knowledge, all product names should be properly working now (other than lures which are on the products page for hay day, https://hayday.fandom.com/wiki/Products , but they can't be traded anyway); I still have to do more sleuthing to make sure there aren't any other "non product" items with messed up names.`],
    ["v1.5.1", `Fixed:
- item names containing the word "and" not working`],
    ["v1.5", `Features Added:
- Made bottom text clickable, allowing you to more quickly modify what it says
- Added clear all button (with a confirmation popup), which removes all items currently added

UI Changes:
- Added some text describing the ability to click an image, quantity, or price to populate all the fields and autofocus the respective one (also mentioned the new ability to click the bottom text to modify it)

Misc. Improvements:
- Added some code to aid in preventing cached versions of the css/js files from being used whenever the site has recently been updated`],
    ["v1.4", `UI Changes:
- Improved the look of the site
- Removed underlines
- Made font (Arial) consistent site-wide
- Moved notes to be part of headers (h2) and made said notes smaller than the rest of the text in the header
- Added special name mapping to BLT Salad so that it would be addable as an item (special name mappings have to be made for names that have abbreviations as a word; the current ones I could find are TNT and BLT)

Bug Fixes:
- Fixed #4 (I sorted the items properly, then proceeded to use the original items object instead of the temporary sorted one)

Whenever I update, you might need to clear cookies on the site to remove the old cached files.  For now, I would recommend clearing cookies, then modifying a setting/item BEFORE refreshing the page so that it all gets stored back into local storage and you don't lose anything.  I am planning on making an import/export system, along with some sort of way to notify someone if any of the cached files are outdated.`],
    ["v1.3", `Features Added:
- Copy to clipboard items as a text list
- Customizable separators of the text list (With 2 default options of newline and comma; the third option allows you to type any string for the separator)

Changes:
- Improved UI layout (particularly for the settings popup)

Bugs Fixed:
- #2`],
    ["v1.2", `Forgot to manually change the size of the coin image (in relation to #1).`],
    ["v1.1", `Fixes the weird issue with images yielding a 404 only on github pages.`],
    ["v1.0", `Main features are:
- creating a grid of item listings
- selecting items to modify their information (set quantity to 0 to remove)
- clicking on the image portion vs the quantity portion vs the price portion of an item focuses and highlights the text of said respective textbox
- changeable number of items per row
- modifiable bottom text
- modifiable abbreviations
- persistent settings/state (refreshing retains your layout, abbreviations, etc.)
- single-click image/screenshot creation (copies it to clipboard to allow quickly pasting)
- auto sorting of items by descending quantity


Some future features:
- Generation of text/list form of items (mostly finished, but not a part of the version)
- More settings (change sort directions/type, manual import/export of items, abbreviations, settings, etc.)
- A few other small QOL ideas that might not be added


There might be a bug or two since I added a lot of features today (in order to release v1.0 ASAP); sorry for any inconveniences.`]
]);
function setUpChangelog()
{
    let changes = [];
    for(let [versionName, versionChanges] of changelog)
    {
        const changeHolder = document.createElement("div");

        const changeHeader = document.createElement("h2");
        changeHeader.innerText = versionName;
        changeHeader.style.textAlign = "center";

        const changeBody = document.createElement("p");
        changeBody.innerText = versionChanges;

        changeHolder.appendChild(changeHeader);
        changeHolder.appendChild(changeBody);

        changes.push(changeHolder);
    }

    // effectively interweaves an hr element between each change div
    changelogOverlay.inner.append(changes.flatMap(elem => [elem, document.createElement("hr")]).slice(0, -1));
}

// TODO -- I might want to put all of the local storage-related calls in wrapper functions in Persist.js
function handleVersionChange()
{
    const latestVersion = changelog.keys().next().value;
    const sLastUsedVersion = localStorage.getItem("lastUsedVersion");

    if(sLastUsedVersion === latestVersion)
        return;

    localStorage.setItem("lastUsedVersion", latestVersion);

    const latestVersionHeader = changelogOverlay.inner.find("h2")[0];
    latestVersionHeader.innerText += " -- NEW!";
    latestVersionHeader.style.color = "red";

    changelogOverlay.showButton.trigger("click");
}

