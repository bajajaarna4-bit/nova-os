# NOVA OS — Installation & Deployment Guide

> **Version**: 0.1.0  
> **Target OS**: NOVA OS (x86_64)  
> **Supported Boot Modes**: UEFI (Secure Boot) and Legacy BIOS (MBR)  

---

## 1. System Requirements & Compatibility

Before beginning installation, verify that the target system satisfies the following hardware requirements:

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Processor** | 64-bit x86-64 CPU (2 cores, 1.8 GHz) | 4+ cores, 2.5+ GHz (AVX2 support for AI) |
| **Memory (RAM)** | 4 GB | 8 GB or 16 GB (for local LLM inference) |
| **Storage** | 32 GB free space | 64+ GB NVMe SSD |
| **Graphics** | Generic KMS / Wayland compatible | Intel Iris Xe / AMD Radeon / NVIDIA (open kernel module) |
| **Firmware** | UEFI 2.3.1+ or BIOS | UEFI with Secure Boot & TPM 2.0 enabled |
| **Network** | Ethernet or Wi-Fi (802.11ac+) | Gigabit Ethernet / Wi-Fi 6 |

---

## 2. Checksum Verification

Always verify the cryptographic integrity of your downloaded image prior to flashing:

### Linux / macOS
```bash
# Verify with SHA256SUMS file
sha256sum -c SHA256SUMS

# Or compare directly
sha256sum nova-os-0.1.0-x86_64.iso
# Expected output: 501d8a0190de04bd4abebc4d84cf4c9e0ee57e7d7328698336a76073749d9630
```

### Windows (PowerShell)
```powershell
Get-FileHash -Algorithm SHA256 .\nova-os-0.1.0-x86_64.iso
# Hash must equal: 501D8A0190DE04BD4ABEBC4D84CF4C9E0EE57E7D7328698336A76073749D9630
```

---

## 3. Creating Bootable USB Media

Ensure your USB drive has at least 8 GB capacity. **All existing data on the USB drive will be erased.**

### Option A: Linux (`dd` CLI)
Identify your USB drive with `lsblk`, then run:
```bash
sudo dd if=nova-os-0.1.0-x86_64.iso of=/dev/sdX bs=4M status=progress oflag=sync
```
*(Replace `/dev/sdX` with the target block device, not a partition like `/dev/sdX1`)*

### Option B: Fedora Media Writer (Cross-Platform)
1. Download and open **Fedora Media Writer**.
2. Select **Custom Image** and navigate to `nova-os-0.1.0-x86_64.iso`.
3. Select your USB drive and click **Write**.

### Option C: Rufus (Windows)
1. Open Rufus and choose your USB flash drive.
2. Select the ISO file `nova-os-0.1.0-x86_64.iso`.
3. Partition scheme: **GPT** (for UEFI) or **MBR** (for BIOS/UEFI).
4. When prompted, select **Write in DD Image mode**.

---

## 4. Virtual Machine Testing (QEMU / KVM)

You can run NOVA OS in an isolated virtual machine before bare-metal installation.

### Standard QEMU BIOS Launch
```bash
qemu-system-x86_64 \
  -m 4G \
  -smp 4 \
  -enable-kvm \
  -cpu host \
  -cdrom dist/release-v0.1.0/nova-os-0.1.0-x86_64.iso \
  -boot d \
  -vga virtio \
  -display default \
  -net nic,model=virtio \
  -net user \
  -device intel-hda \
  -device hda-duplex
```

### QEMU UEFI Secure Boot Launch (with OVMF)
```bash
qemu-system-x86_64 \
  -m 4G \
  -smp 4 \
  -enable-kvm \
  -cpu host \
  -drive if=pflash,format=raw,readonly=on,file=/usr/share/OVMF/OVMF_CODE.secboot.fd \
  -drive if=pflash,format=raw,file=ovmf_vars.fd \
  -cdrom dist/release-v0.1.0/nova-os-0.1.0-x86_64.iso \
  -boot d \
  -vga virtio \
  -net nic,model=virtio -net user
```

---

## 5. Bare-Metal Installation Procedure

1. **BIOS / UEFI Setup**:
   - Enter UEFI setup (`F2`, `F10`, `F12`, or `Del` during boot).
   - Ensure SATA mode is set to **AHCI** (not RAID/Optane).
   - Enable **Secure Boot** (NOVA OS signed bootloaders support standard UEFI DB).
   - Set USB media as the primary boot target.
2. **Boot Menu Selection**:
   - Select `Start NOVA OS 0.1.0 (Live Desktop & Installer)`.
   - For legacy or non-standard graphics cards, select `Safe Graphics Mode (nomodeset)`.
3. **Live Desktop Evaluation**:
   - The system boots directly into the NOVA OS Desktop Environment.
   - Test Wi-Fi, audio, display scaling, dock, application launcher, and AI assistant.
4. **Running the Installer**:
   - Launch the installer icon on the desktop or dock.
   - Choose your installation destination disk.
   - Disk encryption is configured automatically via LUKS2 (AES-XTS-Plain64 with Argon2id PBKDF). Enter a strong passphrase when prompted.
   - Confirm partitioning; the installer stages the immutable OSTree base image.
5. **Reboot**:
   - When the installer finishes, remove the USB drive and click **Restart System**.

---

## 6. First Boot & Onboarding

Upon initial boot into the installed system:
1. **LUKS Disk Decryption**: Enter your disk encryption passphrase to unlock the volume group.
2. **User Setup**: Create your primary administrator account and configure timezone.
3. **AI Provider Selection**:
   - Choose **Local Offline Inference** (requires Ollama service) or connect an optional **Cloud AI Provider** (Google Gemini API key).
   - Set telemetry and data sharing preferences in the Privacy Center.
4. **Security Center Verification**:
   - Open **Security Center** from the dock to verify SELinux mode is `Enforcing` and the nftables firewall is active.

---

## 7. Rollback & Disaster Recovery

NOVA OS utilizes atomic OSTree deployments:
- **Previous Version Fallback**: If an update fails, hold `Shift` or press `Esc` at boot to open the GRUB menu, and select the previous deployment entry.
- **Rollback via Terminal**:
  ```bash
  sudo nova-updater --rollback
  ```
- **Integrity Validation**:
  ```bash
  sudo nova-security --verify-boot-chain
  ```
