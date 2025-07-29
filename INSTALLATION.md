# Installation Guide for Unsigned Builds

Since this is an open source project, our releases are currently **unsigned**. This means you'll see security warnings when installing, but the software is safe to use.

## macOS Installation

1.  Download the `.dmg` file from the [latest release](https://github.com/vibe-stack/vcode/releases/latest)
    
2.  Open the DMG file
    
3.  You'll see a warning: **"vcode IDE" cannot be opened because the developer cannot be verified**
    
4.  **Solution**: Right-click the app → **Open** → Click **Open** in the dialog
    
5.  Or use Terminal: `sudo xattr -rd com.apple.quarantine "/Applications/vcode IDE.app"`
    

## Windows Installation

1.  Download the `.exe` installer from the [latest release](https://github.com/vibe-stack/vcode/releases/latest)
    
2.  You'll see: **Windows protected your PC**
    
3.  **Solution**: Click **More info** → **Run anyway**
    
4.  The installer will proceed normally
    

## Linux Installation

Linux builds are unsigned but don't show warnings:

### Ubuntu/Debian (.deb)

```bash
# Download the .deb file, then:
sudo dpkg -i vcode-ide_*.deb
sudo apt-get install -f  # Fix any dependency issues
```

### Fedora/RHEL (.rpm)

```bash
# Download the .rpm file, then:
sudo rpm -i vcode-ide_*.rpm
# Or with dnf:
sudo dnf install vcode-ide_*.rpm
```

## Why Unsigned?

*   **Code signing certificates cost $99-299/year**
    
*   **This is an open source project** - you can verify the code yourself
    
*   **Many successful open source apps distribute unsigned builds** (OBS Studio, Blender, etc.)
    
*   **The source code is public** on GitHub for transparency
    

## Security Notes

*   ✅ **Source code is public** - you can audit it
    
*   ✅ **Built on GitHub Actions** - transparent build process
    
*   ✅ **No telemetry or tracking** by default
    
*   ⚠️ **Always download from official GitHub releases only**
    

## Future Plans

When the project grows and has funding, we plan to:

*   Get Apple Developer Program membership ($99/year)
    
*   Get Windows code signing certificate (~$200/year)
    
*   Provide signed releases for easier installation