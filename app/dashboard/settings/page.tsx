"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Suspense } from "react";
import { Settings, User, Bell, Shield, Link as LinkIcon, Facebook } from "lucide-react";
import Link from "next/link";

function SettingsContent() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account and application settings
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Account</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your email address cannot be changed here.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <LinkIcon className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Social Media Connections
          </h2>
        </div>
        <div className="space-y-4">
          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-start gap-3">
              <Facebook className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Facebook Connections</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Facebook accounts are connected per business. Go to a business detail page to connect its Facebook page.
                </p>
                <Link
                  href="/dashboard/businesses"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Go to Businesses →
                </Link>
              </div>
            </div>
          </div>

          {/* Other Platforms (Coming Soon) */}
          <div className="p-4 border border-gray-200 rounded-lg opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Instagram</h3>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Twitter</h3>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">LinkedIn</h3>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              Notification settings will be available soon.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Privacy & Security</h2>
        </div>
        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              Privacy and security settings will be available soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading settings...</div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

