import React, { useState } from 'react';
import {
    Settings, Shield, Bell, Gauge, HardDrive, Zap, ToggleLeft, ToggleRight,
    Save, Globe, Lock, AlertTriangle, Server, Database, Clock, Check
} from 'lucide-react';

function ToggleSwitch({ enabled, onToggle, label, description }) {
    return (
        <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.03] transition-all">
            <div>
                <p className="text-xs font-semibold">{label}</p>
                {description && <p className="text-[10px] text-zinc-500 mt-0.5">{description}</p>}
            </div>
            <button onClick={onToggle} className="shrink-0">
                {enabled ? (
                    <ToggleRight size={28} className="text-green-400" />
                ) : (
                    <ToggleLeft size={28} className="text-zinc-600" />
                )}
            </button>
        </div>
    );
}

function SettingInput({ label, value, onChange, type = 'text', suffix }) {
    return (
        <div className="p-3 bg-white/[0.02] rounded-xl">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1.5">{label}</label>
            <div className="flex items-center gap-2">
                <input type={type} value={value} onChange={e => onChange(e.target.value)}
                    className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/30" />
                {suffix && <span className="text-[10px] text-zinc-500 shrink-0">{suffix}</span>}
            </div>
        </div>
    );
}

export function AdminSettings() {
    const [saved, setSaved] = useState(false);
    const [config, setConfig] = useState({
        maintenanceMode: false,
        registrationEnabled: true,
        emailNotifications: true,
        twoFactorRequired: false,
        rateLimitMax: 500,
        rateLimitWindow: 15,
        maxFileSize: 500,
        storageLimit: 10,
        sessionTimeout: 30,
        backupEnabled: false,
        analyticsEnabled: true,
        debugMode: false,
        apiDocsPublic: false,
        autoSuspendEnabled: false,
    });

    const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black">Platform Settings</h1>
                    <p className="text-xs text-zinc-500">Configure system-wide settings</p>
                </div>
                <button onClick={handleSave}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-zinc-100'
                        }`}>
                    {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
                </button>
            </div>

            {/* System */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Server size={14} className="text-indigo-400" /> System
                </h3>
                <div className="space-y-2">
                    <ToggleSwitch
                        label="Maintenance Mode"
                        description="Show maintenance page to all non-admin users"
                        enabled={config.maintenanceMode}
                        onToggle={() => updateConfig('maintenanceMode', !config.maintenanceMode)}
                    />
                    <ToggleSwitch label="Debug Mode" description="Enable detailed error logging"
                        enabled={config.debugMode} onToggle={() => updateConfig('debugMode', !config.debugMode)} />
                    <ToggleSwitch label="Automatic Backups" description="Daily automated database backups"
                        enabled={config.backupEnabled} onToggle={() => updateConfig('backupEnabled', !config.backupEnabled)} />
                </div>
            </div>

            {/* Security */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Shield size={14} className="text-red-400" /> Security
                </h3>
                <div className="space-y-2">
                    <ToggleSwitch label="Registration Enabled" description="Allow new users to create accounts"
                        enabled={config.registrationEnabled} onToggle={() => updateConfig('registrationEnabled', !config.registrationEnabled)} />
                    <ToggleSwitch label="Two-Factor Required" description="Enforce 2FA for all users"
                        enabled={config.twoFactorRequired} onToggle={() => updateConfig('twoFactorRequired', !config.twoFactorRequired)} />
                    <ToggleSwitch label="Auto-Suspend Inactive" description="Suspend accounts inactive for 90+ days"
                        enabled={config.autoSuspendEnabled} onToggle={() => updateConfig('autoSuspendEnabled', !config.autoSuspendEnabled)} />
                    <SettingInput label="Session Timeout" value={config.sessionTimeout}
                        onChange={v => updateConfig('sessionTimeout', v)} type="number" suffix="days" />
                </div>
            </div>

            {/* Rate Limiting */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Gauge size={14} className="text-amber-400" /> Rate Limiting
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <SettingInput label="Max Requests" value={config.rateLimitMax}
                        onChange={v => updateConfig('rateLimitMax', v)} type="number" suffix="/ window" />
                    <SettingInput label="Window Duration" value={config.rateLimitWindow}
                        onChange={v => updateConfig('rateLimitWindow', v)} type="number" suffix="minutes" />
                </div>
            </div>

            {/* Storage */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <HardDrive size={14} className="text-cyan-400" /> Storage
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <SettingInput label="Max File Upload Size" value={config.maxFileSize}
                        onChange={v => updateConfig('maxFileSize', v)} type="number" suffix="MB" />
                    <SettingInput label="User Storage Limit" value={config.storageLimit}
                        onChange={v => updateConfig('storageLimit', v)} type="number" suffix="GB" />
                </div>
            </div>

            {/* Features */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Zap size={14} className="text-purple-400" /> Features
                </h3>
                <div className="space-y-2">
                    <ToggleSwitch label="Analytics Tracking" description="Track platform usage analytics"
                        enabled={config.analyticsEnabled} onToggle={() => updateConfig('analyticsEnabled', !config.analyticsEnabled)} />
                    <ToggleSwitch label="Email Notifications" description="Send email notifications to users"
                        enabled={config.emailNotifications} onToggle={() => updateConfig('emailNotifications', !config.emailNotifications)} />
                    <ToggleSwitch label="Public API Docs" description="Make API documentation publicly accessible"
                        enabled={config.apiDocsPublic} onToggle={() => updateConfig('apiDocsPublic', !config.apiDocsPublic)} />
                </div>
            </div>

            {/* Danger Zone */}
            <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-red-400">
                    <AlertTriangle size={14} /> Danger Zone
                </h3>
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                        <div>
                            <p className="text-xs font-semibold text-red-300">Purge All Data</p>
                            <p className="text-[10px] text-zinc-500">Permanently delete all user data and projects</p>
                        </div>
                        <button className="px-4 py-1.5 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-[10px] font-bold hover:bg-red-500/30 transition-all">
                            Purge
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                        <div>
                            <p className="text-xs font-semibold text-red-300">Reset Platform</p>
                            <p className="text-[10px] text-zinc-500">Reset all settings to factory defaults</p>
                        </div>
                        <button className="px-4 py-1.5 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-[10px] font-bold hover:bg-red-500/30 transition-all">
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
