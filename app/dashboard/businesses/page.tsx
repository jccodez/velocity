"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useEffect, useState } from "react";
import { getBusinessesByUserId, Business, deleteBusiness } from "@/lib/firebase/businesses";
import { Plus, Building2, Trash2, Edit, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BusinessesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBusinesses();
    }
  }, [user]);

  const loadBusinesses = async () => {
    if (!user) return;
    try {
      const data = await getBusinessesByUserId(user.uid);
      setBusinesses(data);
    } catch (error) {
      console.error("Error loading businesses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (businessId: string) => {
    if (!confirm("Are you sure you want to delete this business?")) return;
    try {
      await deleteBusiness(businessId);
      setBusinesses(businesses.filter((b) => b.id !== businessId));
    } catch (error) {
      console.error("Error deleting business:", error);
      alert("Failed to delete business");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading businesses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Businesses</h1>
          <p className="text-gray-600 mt-2">
            Manage your businesses and their social media presence
          </p>
        </div>
        <Link
          href="/dashboard/businesses/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Business
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No businesses yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first business to start managing campaigns.
          </p>
          <Link
            href="/dashboard/businesses/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Business
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/businesses/${business.id}/edit`}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => business.id && handleDelete(business.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {business.name}
              </h3>
              {business.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {business.description}
                </p>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mb-4"
                >
                  {business.website.replace(/^https?:\/\//, "")}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {business.toneOfVoice && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-1">Tone of Voice</p>
                  <p className="text-sm text-gray-700">{business.toneOfVoice}</p>
                </div>
              )}
              <Link
                href={`/dashboard/businesses/${business.id}`}
                className="block mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View Details →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

