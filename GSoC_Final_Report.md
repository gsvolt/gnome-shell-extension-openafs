# Google Summer of Code 2025 Final Report

## Project: GNOME Shell Extension for OpenAFS
**Student**: Tejas Sonawane  
**Organization**: OpenAFS  
**Repository**: [https://github.com/openafs-contrib/gnome-shell-extension-openafs](https://github.com/openafs-contrib/gnome-shell-extension-openafs)  
**Mentors**: Michael Meffie, Gaurav Saxena  
**Timeline**: June 2, 2025 - September 1, 2025 (Standard Coding Period)

---

## Project Overview

The goal of this Google Summer of Code (GSoC) project was to develop a GNOME Shell extension to enhance the integration of the OpenAFS distributed filesystem with the GNOME desktop environment. The extension provides users with a seamless interface to manage and monitor OpenAFS, including features like starting/stopping the OpenAFS client, toggling autostart, viewing token expiration, and checking cell connectivity status directly from the GNOME Shell panel.

OpenAFS is a distributed filesystem that enables users to access files across a network of computers as if they were stored locally. This extension simplifies user interaction with OpenAFS by integrating its functionality into the GNOME Shell, making it more accessible for users unfamiliar with command-line tools.

---

## Project Goals

The primary objectives of the project were:
1. **Develop a GNOME Shell Extension**: Create a user-friendly interface to monitor and manage the OpenAFS client and tokens within the GNOME Shell.
2. **Implement Key Features**:
   - Start and stop the OpenAFS client via systemd.
   - Toggle autostart for the OpenAFS client (enable/disable on boot).
   - Display token expiration and current AFS cell name or connectivity status.
   - Provide real-time status updates and user notifications for client and token operations.
3. **Ensure Compatibility**: Support modern GNOME Shell versions (e.g., GNOME 46 and above).
4. **Write Documentation**: Provide clear setup instructions and usage guides for end-users and developers.

---

## Work Accomplished

### 1. Extension Development
- **Core Functionality**: Built a GNOME Shell extension using JavaScript and the GJS (GNOME JavaScript) framework, adhering to GNOME Shell extension guidelines.
- **AFS Integration**: Integrated with OpenAFS command-line tools (e.g., `tokens`, `fs`, `systemctl`) to manage the OpenAFS client and tokens.
- **UI Implementation**: Designed a panel menu with the following features:
  - Start and stop the OpenAFS client via systemd.
  - Toggle autostart for the OpenAFS client (enable/disable on boot).
  - Display token expiration and current AFS cell name or connectivity status.
  - Real-time status updates for client and token information.
  - User notifications for successful or failed operations.
  - Dynamic UI feedback during client and autostart actions.

### 2. Implemented Features
The following features were successfully implemented:
- ✅ Start and stop the OpenAFS client via systemd.
- ✅ Toggle autostart for the OpenAFS client (enable/disable on boot).
- ✅ View token expiration and current AFS cell name (or “cell connectivity”).
- ✅ Real-time status updates for client and token information.
- ✅ User notifications for successful or failed operations.
- ✅ Dynamic UI feedback during client and autostart actions.

---

## 📸 Screenshots

### 🖼️ GNOME Top Bar Menu Preview

![Top bar UI](assets/screenshot.png)  
Shows the OpenAFS status menu with Start/Stop client options, a toggle switch for enabling/disabling autostart on boot, token status, and client status.

### 3. Compatibility and Testing
- Tested the extension on GNOME Shell version 46, ensuring compatibility with recent Ubuntu and Fedora distributions.

### 4. Documentation
- Wrote a comprehensive `README.md` in the repository, including:
  - Installation instructions for OpenAFS and the extension.
  - Usage guide for end-users.
  - Developer guide for contributing to the extension.
- Created a wiki page on the OpenAFS website with troubleshooting tips and FAQs.

### 5. Code Contributions
- **Repository**: All code was developed in the [openafs-contrib/gnome-shell-extension-openafs](https://github.com/openafs-contrib/gnome-shell-extension-openafs) repository.

### 6. Community Engagement
- Collaborated with mentors to refine the extension’s design and address technical challenges, such as secure integration with OpenAFS command-line tools.

---

## Current State

- **Completed Features**:
  - Fully functional GNOME Shell extension with client management, token monitoring, and autostart functionality.
  - Real-time status updates and user notifications.
  - Comprehensive documentation and test coverage.
- **Merged Code**: All pull requests have been merged into the main branch of the repository.
- **Distribution**: The extension is available for manual installation from the [GitHub repository](https://github.com/openafs-contrib/gnome-shell-extension-openafs).
- **Testing**: The extension has been tested on multiple Linux distributions (Ubuntu 24.04, Fedora 41) with OpenAFS 1.8.x and 1.9.x.

---

## Future Enhancements

- Implement notifications for token expiration to enhance user experience.

---

## Challenges Faced

- **Learning GJS**: The GNOME Shell extension framework (GJS) was initially unfamiliar, requiring significant time to learn its APIs and best practices.
- **OpenAFS Integration**: Interfacing with OpenAFS command-line tools securely required careful handling of subprocesses and error conditions.
- **Mentor Feedback**: Incorporated extensive mentor feedback to refine the UI and improve code quality, which was time-consuming but valuable.

---

## Lessons Learned

- **Open Source Collaboration**: Gained experience in contributing to an open source project, including writing clean code, submitting pull requests, and engaging with the community.
- **GNOME Ecosystem**: Learned about the GNOME Shell extension framework and its integration with Linux desktop environments.
- **OpenAFS Internals**: Developed a deeper understanding of the OpenAFS distributed filesystem and its command-line tools.
- **Time Management**: Balanced coding, documentation, and community engagement within the 12-week coding period, emphasizing the importance of planning and prioritization.

---

## Future Plans

- Continue contributing to the OpenAFS community by maintaining and improving the GNOME Shell extension.
- Implement notifications for token expiration to enhance user experience.

---

## Acknowledgments

I am immensely grateful to my mentors Michael Meffie and Gaurav Saxena for their guidance, feedback, and support throughout the GSoC program. Their expertise in OpenAFS and open source development was invaluable in shaping this project. I also thank the OpenAFS community for their warm welcome and encouragement, and Google for organizing GSoC, which provided me with this incredible opportunity to contribute to open source.

This project has been a rewarding journey, and I look forward to continuing my involvement with OpenAFS and the broader open source community!

**Signed**,  
Tejas Sonawane  
[https://github.com/ts-31/](https://github.com/ts-31/)  
[sonawanetejas031@gmail.com](mailto:sonawanetejas031@gmail.com)