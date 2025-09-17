<img src="https://github.com/user-attachments/assets/5c8f7b67-024e-4517-a17a-179767db3f2a">

<div align="center">

### ACT Score Hider

Hides ACT scores on the ACT website and allows you to reveal them by clicking on them.
<p>
    <img src="https://img.shields.io/badge/Downloads%3A-343434" alt="Downloads:">
    <a href="https://addons.mozilla.org/en-US/firefox/"><img src="https://img.shields.io/badge/Firefox-FF7139?logo=Firefox&logoColor=white" alt="Download for Firefox"></a>
    <a href="https://chromewebstore.google.com/"><img src="https://img.shields.io/badge/Chrome-4285F4?logo=GoogleChrome&logoColor=white" alt="Download for Chrome"></a>
</p>
</div>


### Features

- **Automatic Hiding**: Scores are automatically hidden when you visit ACT score pages
- **Click to Reveal**: Click on any hidden score to reveal it
- **Sound Effects**: Play custom sounds based on score thresholds (e.g., high score sound for 34-36)
- **Confetti Effects**: Trigger confetti animations based on score thresholds
- **Persistence**: Remember which scores you've revealed
- **Customizable Thresholds**: Set custom score ranges for sounds and confetti in the extension popup
- **Popup Control**: Extension popup shows status, allows showing/hiding all scores, and advanced settings
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+S` - Show all scores
  - `Ctrl+Shift+H` - Hide all scores


### How It Works

1. When you visit an ACT scores page, the extension automatically scans for score elements
2. Valid scores are replaced with "?"
3. Hidden scores have a dashed border and a "?" placeholder
4. Click any hidden score to reveal it with a sound effect and/or confetti if configured
5. Customize sound and confetti thresholds in the popup settings
6. Upload custom MP3 files for personalized sound effects


### Settings

```Sound Effects```
- Enable/disable sound effects
- Set score thresholds for different sounds (e.g., high-score.mp3 for 34-36)
- Upload custom MP3 files for each threshold
- Default sounds: high-score, mid-high-score, mid-score, low-score

```Confetti Effects```
- Enable/disable confetti animations
- Set score thresholds for confetti intensity (low, medium, high)
- Automatic confetti on score reveal based on thresholds

```Storage```
- Toggle score persistence to remember revealed scores (enabled by default)
- Clear all extension data if needed

#### Troubleshooting
```
Extension not working?
- Make sure you're on an ACT website (act.org domain)
- Try refreshing the page after installing the extension
- Check that the extension is enabled in your browser's extension settings
- Check if Manifest V3 is supported in your browser

Scores not hiding?
- The page might use a different layout than expected
- Try refreshing the page
- Check the browser console for any errors
- Verify the content script is running on the page

Can't reveal scores?
- Make sure you're clicking directly on the "?" text or the circle around it
- Try using the "Show All" button in the extension popup
- Use the keyboard shortcut `Ctrl+Shift+S`

Sounds or confetti not working?
- Check that audio is enabled in the popup settings
- Make sure MP3 files are properly uploaded
- Verify browser permissions for audio playback
- For confetti, make sure JavaScript is enabled

Settings not saving?
- Check browser console for storage errors
- Make sure it has storage permissions
- Try clearing extension data and reconfiguring

Any other problems or suggestions?
- Email me @ nobidevs@gmail.com
```
#### Privacy
```
This extension:
- Only runs on ACT websites
- Does not collect or transmit any personal data
- Only modifies the visual display of scores on your local browser
- Stores settings and custom sounds locally in browser storage
- Does not affect the actual scores or your ACT account

```
<sub>ACT® is a trademark registered by the ACT, which is not affiliated with, and does not endorse, this product.</sub>
