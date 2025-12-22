"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getBusinessById, updateBusiness, Business } from "@/lib/firebase/businesses";
import { Building2, Globe, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditBusinessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    toneOfVoice: "",
  });

  useEffect(() => {
    if (businessId && user) {
      loadBusiness();
    }
  }, [businessId, user]);

  const loadBusiness = async () => {
    if (!businessId) return;
    try {
      const business = await getBusinessById(businessId);
      if (business) {
        setFormData({
          name: business.name || "",
          description: business.description || "",
          website: business.website || "",
          facebook: business.socialMediaAccounts?.facebook || "",
          instagram: business.socialMediaAccounts?.instagram || "",
          twitter: business.socialMediaAccounts?.twitter || "",
          linkedin: business.socialMediaAccounts?.linkedin || "",
          toneOfVoice: business.toneOfVoice || "",
        });
      }
    } catch (error) {
      console.error("Error loading business:", error);
      alert("Failed to load business");
      router.push("/dashboard/businesses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !businessId) return;

    setSaving(true);
    try {
      await updateBusiness(businessId, {
        name: formData.name,
        description: formData.description || undefined,
        website: formData.website || undefined,
        socialMediaAccounts: {
          facebook: formData.facebook || undefined,
          instagram: formData.instagram || undefined,
          twitter: formData.twitter || undefined,
          linkedin: formData.linkedin || undefined,
        },
        toneOfVoice: formData.toneOfVoice || undefined,
      });
      router.push(`/dashboard/businesses/${businessId}`);
    } catch (error) {
      console.error("Error updating business:", error);
      alert("Failed to update business");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/dashboard/businesses/${businessId}`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Business
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Business</h1>
        <p className="text-gray-600 mt-2">
          Update your business profile information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Acme Inc."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Tell us about your business..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tone of Voice
          </label>
          <textarea
            value={formData.toneOfVoice}
            onChange={(e) => setFormData({ ...formData, toneOfVoice: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Professional, friendly, casual, etc. (or use the analyze buttons on the business detail page)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Describe your business&apos;s communication style. You can also use the &quot;Analyze&quot; buttons on the business detail page to learn it automatically.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Social Media Accounts (Optional)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-2">Facebook</label>
              <input
                type="text"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-2">Instagram</label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-2">Twitter</label>
              <input
                type="text"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-2">LinkedIn</label>
              <input
                type="text"
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="@username"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href={`/dashboard/businesses/${businessId}`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

