Name:           nova-os
Version:        0.1.0
Release:        1%{?dist}
Summary:        NOVA OS Core System Components and Desktop Shell
License:        Apache-2.0
URL:            https://nova-os.dev
Source0:        %{name}-%{version}.tar.gz

BuildRequires:  rust >= 1.75
BuildRequires:  cargo
BuildRequires:  systemd-rpm-macros
BuildRequires:  polkit-devel

Requires:       systemd
Requires:       polkit
Requires:       dbus

%description
NOVA OS combines atomic system deployments, zero-trust security architecture,
local-first AI assistance, and an intuitive desktop shell.

%prep
%autosetup

%build
cargo build --release --workspace

%install
mkdir -p %{buildroot}%{_bindir}
mkdir -p %{buildroot}%{_unitdir}
mkdir -p %{buildroot}%{_datadir}/polkit-1/actions

install -m 0755 target/release/nova-core %{buildroot}%{_bindir}/nova-core
install -m 0755 target/release/nova-permissions %{buildroot}%{_bindir}/nova-permissions
install -m 0755 target/release/nova-security %{buildroot}%{_bindir}/nova-security
install -m 0755 target/release/nova-ai-runtime %{buildroot}%{_bindir}/nova-ai-runtime
install -m 0755 target/release/nova-updater %{buildroot}%{_bindir}/nova-updater

install -m 0644 os/boot/*.service %{buildroot}%{_unitdir}/
install -m 0644 os/policies/nova.policy %{buildroot}%{_datadir}/polkit-1/actions/org.nova.policy

%files
%{_bindir}/nova-core
%{_bindir}/nova-permissions
%{_bindir}/nova-security
%{_bindir}/nova-ai-runtime
%{_bindir}/nova-updater
%{_unitdir}/*.service
%{_datadir}/polkit-1/actions/org.nova.policy

%changelog
* Sun Nov 24 2026 NOVA OS Engineering <team@nova-os.dev> - 0.1.0-1
- Initial development prototype release
