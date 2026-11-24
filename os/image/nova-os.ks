# =============================================================================
# NOVA OS Kickstart File
# Purpose: Anaconda unattended installation for creating bootable ISO
# Compatibility: UEFI (Secure Boot) + Legacy BIOS
# Usage: mkksiso nova-os.ks nova-os-base.iso nova-os-install.iso
# =============================================================================

# --- Installation method ---
# Install from the first CD/DVD drive found (lorax-generated ISO)
cdrom

# --- UI mode ---
# text mode for server installs; graphical for desktop ISO
graphical

# --- Language and locale ---
lang en_US.UTF-8
keyboard --vckeymap=us --xlayouts='us'
timezone --utc UTC

# =============================================================================
# Network configuration
# Configure DHCP on first found ethernet interface; hostname set to nova-os
# =============================================================================
network --bootproto=dhcp --device=link --activate --hostname=nova-os

# =============================================================================
# Partitioning
# UEFI + BIOS dual compatible via GPT with a small BIOS boot partition.
# Disk encryption is prompted via LUKS if not set in --passphrase.
# To enable full-disk encryption, uncomment --luks-* options below and
# remove the "--noformat" from /boot/efi.
# =============================================================================

# Wipe the entire disk and use automatic partitioning with GPT
zerombr
clearpart --all --initlabel --disklabel=gpt

# BIOS Boot Partition (required for GRUB on GPT/BIOS systems)
part biosboot --fstype=biosboot --size=1

# EFI System Partition for UEFI boot (FAT32, 512MB)
part /boot/efi --fstype=efi --size=512 --fsoptions="umask=0077,shortname=winnt"

# /boot — unencrypted ext4 (bootloader cannot read LUKS without initrd)
part /boot --fstype=ext4 --size=1024 --asprimary

# LUKS-encrypted LVM physical volume for the rest of the disk
# Users will be prompted for a passphrase at install time unless --passphrase is set
part pv.01 --fstype=lvmpv --size=1 --grow \
    --encrypted \
    --luks-version=luks2 \
    --cipher=aes-xts-plain64 \
    --pbkdf=argon2id \
    --pbkdf-time=2000

# LVM volume group
volgroup nova_vg pv.01

# Root filesystem — 20 GB XFS (OSTree prefers XFS or ext4)
logvol / --vgname=nova_vg --fstype=xfs --size=20480 --name=root

# /var — separate to allow atomic root replacements (OSTree requirement)
logvol /var --vgname=nova_vg --fstype=xfs --size=10240 --name=var

# Swap — 4 GB (adjust based on target RAM)
logvol swap --vgname=nova_vg --fstype=swap --size=4096 --name=swap

# =============================================================================
# Bootloader configuration
# Install GRUB2 to MBR (BIOS) and ESP (UEFI); set boot timeout
# =============================================================================
bootloader --location=mbr \
           --boot-drive=sda \
           --iscrypted \
           --timeout=5 \
           --append="rhgb quiet rd.luks.options=discard enforcing=1 audit=1"

# =============================================================================
# Package selection
# Use the nova-os.spec groups plus core desktop packages
# @workstation-product-environment provides the graphical base
# =============================================================================
%packages
@^workstation-product-environment
@core
@hardware-support
@fonts
@multimedia
@sound-and-video

# NOVA OS specific packages
wayland-protocols
pipewire
wireplumber
pipewire-pulseaudio
pipewire-alsa
polkit
flatpak
xdg-desktop-portal
nftables
audit
aide
selinux-policy
selinux-policy-targeted
checkpolicy
policycoreutils
policycoreutils-python-utils

# Bootloader / Secure Boot
grub2-efi-x64
grub2-pc
shim-x64
mokutil

# System utilities
dbus-daemon
xdg-user-dirs
xdg-utils
bash-completion
curl
wget
git

# Exclude packages that conflict with nova services or add attack surface
-blueman
-gnome-remote-desktop
-rsh
-telnet
-tftp
%end

# =============================================================================
# Pre-installation script
# Runs in the Anaconda environment before disk formatting
# =============================================================================
%pre --log=/tmp/nova-pre.log --interpreter=/bin/bash
echo "[NOVA PRE-INSTALL] Starting pre-install validation"

# Ensure we have at least 20GB of disk space on the target drive
DISK_SIZE_BYTES=$(lsblk -b -n -d -o SIZE /dev/sda 2>/dev/null || echo 0)
MIN_BYTES=$((21474836480)) # 20 GB
if [ "$DISK_SIZE_BYTES" -lt "$MIN_BYTES" ]; then
    echo "[NOVA PRE-INSTALL] ERROR: Disk too small (${DISK_SIZE_BYTES} bytes, need 20GB+)"
    exit 1
fi

echo "[NOVA PRE-INSTALL] Pre-install checks passed"
%end

# =============================================================================
# Post-installation script (runs in chroot)
# Configures nova services, enrolls Secure Boot keys, etc.
# =============================================================================
%post --log=/var/log/nova-post-install.log --interpreter=/bin/bash
set -euo pipefail

echo "=== NOVA OS Post-Install Configuration ==="

# ---------------------------------------------------------------------------
# 1. Create nova-system user and group for system services
# ---------------------------------------------------------------------------
groupadd --system nova-system
useradd --system --no-create-home --shell /sbin/nologin \
        --gid nova-system nova-system

groupadd --system nova-ai
useradd --system --no-create-home --shell /sbin/nologin \
        --gid nova-ai nova-ai

groupadd nova

echo "[NOVA] System users created"

# ---------------------------------------------------------------------------
# 2. Install nova binaries (copied from ISO payload)
# In a real ISO, these would be in the ISO filesystem at /run/install/repo/
# ---------------------------------------------------------------------------
if [ -d /run/install/repo/nova-bin ]; then
    install -m 755 -o root -g root /run/install/repo/nova-bin/nova-core         /usr/bin/nova-core
    install -m 755 -o root -g root /run/install/repo/nova-bin/nova-permissions   /usr/bin/nova-permissions
    install -m 755 -o root -g root /run/install/repo/nova-bin/nova-ai-runtime    /usr/bin/nova-ai-runtime
    install -m 755 -o root -g root /run/install/repo/nova-bin/nova-security      /usr/bin/nova-security
    install -m 755 -o root -g root /run/install/repo/nova-bin/nova-updater       /usr/bin/nova-updater
    echo "[NOVA] Binaries installed"
else
    echo "[NOVA] WARNING: nova-bin directory not found in install repo; binaries not installed"
fi

# ---------------------------------------------------------------------------
# 3. Install systemd service units
# ---------------------------------------------------------------------------
if [ -d /run/install/repo/nova-services ]; then
    install -m 644 /run/install/repo/nova-services/*.service /usr/lib/systemd/system/
    systemctl enable nova-core.service
    systemctl enable nova-permissions.service
    systemctl enable nova-ai-runtime.service
    systemctl enable nova-security.service
    systemctl enable nova-updater.service
    echo "[NOVA] Systemd units installed and enabled"
fi

# ---------------------------------------------------------------------------
# 4. Install polkit policy
# ---------------------------------------------------------------------------
if [ -f /run/install/repo/nova-policies/nova.policy ]; then
    install -m 644 /run/install/repo/nova-policies/nova.policy \
                   /usr/share/polkit-1/actions/org.nova.policy
    echo "[NOVA] Polkit policy installed"
fi

# ---------------------------------------------------------------------------
# 5. Configure SELinux enforcing
# ---------------------------------------------------------------------------
sed -i 's/^SELINUX=.*/SELINUX=enforcing/' /etc/selinux/config
sed -i 's/^SELINUXTYPE=.*/SELINUXTYPE=targeted/' /etc/selinux/config
echo "[NOVA] SELinux set to enforcing"

# Install custom nova SELinux policy module if present
if [ -f /run/install/repo/nova-policies/nova-selinux.pp ]; then
    semodule -i /run/install/repo/nova-policies/nova-selinux.pp
    echo "[NOVA] SELinux policy module installed"
fi

# ---------------------------------------------------------------------------
# 6. Configure nftables firewall
# ---------------------------------------------------------------------------
systemctl enable nftables.service
echo "[NOVA] nftables enabled"

# ---------------------------------------------------------------------------
# 7. Set graphical.target as default
# ---------------------------------------------------------------------------
systemctl set-default graphical.target
echo "[NOVA] Default target set to graphical"

# ---------------------------------------------------------------------------
# 8. Initialize AIDE database for file integrity baseline
# ---------------------------------------------------------------------------
# Run aide --init in background (can be slow)
aide --init --config /etc/aide.conf &
echo "[NOVA] AIDE database initialization started in background (PID $!)"

# ---------------------------------------------------------------------------
# 9. Enable auditd
# ---------------------------------------------------------------------------
systemctl enable auditd.service
echo "[NOVA] auditd enabled"

# ---------------------------------------------------------------------------
# 10. Secure Boot key enrollment preparation
# Generate Machine Owner Key (MOK) pair for self-signed module enrollment
# Production builds use a pre-generated hardware-secured key instead.
# ---------------------------------------------------------------------------
mkdir -p /etc/nova/secure-boot

# Generate a local MOK key (replace with an HSM-backed key in production)
openssl req -new -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
    -keyout /etc/nova/secure-boot/nova-mok.key \
    -out    /etc/nova/secure-boot/nova-mok.crt \
    -subj   "/CN=NOVA OS Secure Boot MOK/O=NOVA OS Project/C=US" \
    2>/dev/null || echo "[NOVA] WARNING: openssl not available; MOK generation skipped"

if [ -f /etc/nova/secure-boot/nova-mok.crt ]; then
    chmod 400 /etc/nova/secure-boot/nova-mok.key
    chmod 444 /etc/nova/secure-boot/nova-mok.crt

    # Enroll the MOK on next reboot (user will see a blue MokManager screen)
    mokutil --import /etc/nova/secure-boot/nova-mok.crt \
            --root-pw 2>/dev/null && \
        echo "[NOVA] MOK enrollment queued for next reboot" || \
        echo "[NOVA] WARNING: mokutil import failed; manual enrollment required"
fi

echo "=== NOVA OS Post-Install Configuration COMPLETE ==="
%end

# =============================================================================
# Post-install script (outside chroot) — for additional host-level operations
# =============================================================================
%post --nochroot --log=/tmp/nova-post-nochroot.log
echo "[NOVA NOCHROOT] Writing install timestamp"
date --utc --iso-8601=seconds > /mnt/sysimage/etc/nova/install-timestamp
%end

# =============================================================================
# Reboot after installation completes (eject CD automatically)
# =============================================================================
reboot --eject
