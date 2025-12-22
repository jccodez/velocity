"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { getBusinessById, Business, updateBusiness } from "@/lib/firebase/businesses";
import { getCampaignsByBusinessId } from "@/lib/firebase/campaigns";
import { getPostsByBusinessId } from "@/lib/firebase/posts";
import { 
  analyzeToneFromBusinessInfo, 
  analyzeToneFromWebsite,
  analyzeToneFromFacebook
} from "@/lib/ai/contentGenerator";
import { getFacebookConnection, disconnectFacebook, saveFacebookToken } from "@/lib/firebase/facebook";
import { useAuth } from "@/lib/hooks/useAuth";
import { Building2, Briefcase, FileText, ArrowLeft, Edit, Sparkles, Loader2, Facebook, CheckCircle, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function BusinessDetailContent() {
  const params = useParams();
  const businessId = params.id as string;
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [facebookPageName, setFacebookPageName] = useState<string | null>(null);

  const checkFacebookConnection = async () => {
    if (!businessId) return;
    try {
      const connection = await getFacebookConnection(businessId);
      setFacebookConnected(!!connection);
      setFacebookPageName(connection?.pageName || null);
    } catch (error) {
      console.error("Error checking Facebook connection:", error);
    }
  };

  const handleFacebookCallback = useCallback(async (token: string, pageId?: string, pageName?: string) => {
    if (!business || !user || !businessId) return;
    
    try {
      // Save the token with proper user context
      await saveFacebookToken(
        businessId,
        business.userId,
        token,
        pageId,
        pageName
      );
      
      setFacebookConnected(true);
      setFacebookPageName(pageName || null);
      
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      
      // Reload connection status
      const connection = await getFacebookConnection(businessId);
      setFacebookConnected(!!connection);
      setFacebookPageName(connection?.pageName || null);
    } catch (error: any) {
      console.error("Error saving Facebook token:", error);
      setAnalysisError(error.message || "Failed to save Facebook connection");
    }
  }, [business, user, businessId]);

  const loadBusinessData = async () => {
    try {
      const businessData = await getBusinessById(businessId);
      setBusiness(businessData);

      if (businessData) {
        setBusiness(businessData);
        const campaigns = await getCampaignsByBusinessId(businessId);
        const posts = await getPostsByBusinessId(businessId);
        setCampaignsCount(campaigns.length);
        setPostsCount(posts.length);
      }
      
      // Check Facebook connection
      await checkFacebookConnection();
    } catch (error) {
      console.error("Error loading business:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectFacebook = () => {
    window.location.href = `/api/facebook/connect?businessId=${businessId}`;
  };

  useEffect(() => {
    if (businessId) {
      loadBusinessData();
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) {
      checkFacebookConnection();
    }
  }, [businessId]);

  useEffect(() => {
    // Check for Facebook callback parameters after business is loaded
    if (!business || !user) return;
    
    const callback = searchParams?.get('facebook_callback');
    const token = searchParams?.get('facebook_token');
    const pageId = searchParams?.get('facebook_page_id');
    const pageName = searchParams?.get('facebook_page_name');
    const error = searchParams?.get('facebook_error');
    
    if (callback && token) {
      // Complete the Facebook connection
      handleFacebookCallback(token, pageId || undefined, pageName ? decodeURIComponent(pageName) : undefined);
    } else if (error) {
      setAnalysisError(`Facebook connection error: ${decodeURIComponent(error)}`);
    }
  }, [searchParams, user, business, businessId, handleFacebookCallback]);

  const handleDisconnectFacebook = async () => {
    if (!confirm("Are you sure you want to disconnect Facebook for this business?")) return;
    
    try {
      await disconnectFacebook(businessId);
      setFacebookConnected(false);
      setFacebookPageName(null);
    } catch (error) {
      console.error("Error disconnecting Facebook:", error);
      alert("Failed to disconnect Facebook");
    }
  };

  const handleAnalyzeTone = async (source: 'description' | 'website' | 'facebook') => {
    if (!business) return;
    
    setAnalyzing(true);
    setAnalysisError(null);
    
    try {
      let tone: string;
      
      if (source === 'website' && business.website) {
        try {
          tone = await analyzeToneFromWebsite(business.website);
        } catch (error) {
          // Fallback to description if website analysis fails
          tone = await analyzeToneFromBusinessInfo(
            business.name,
            business.description,
            business.toneOfVoice
          );
        }
      } else if (source === 'facebook' && business.socialMediaAccounts?.facebook) {
        try {
          // Get stored Facebook token for this business
          const token = await getFacebookConnection(businessId);
          
          if (!token || !token.accessToken) {
            throw new Error("Facebook not connected for this business. Please connect Facebook for this business first.");
          }
          
          tone = await analyzeToneFromFacebook(
            business.socialMediaAccounts.facebook, 
            token.accessToken
          );
        } catch (error: any) {
          setAnalysisError(error.message || "Facebook analysis requires connection. Please connect Facebook for this business first.");
          return;
        }
      } else {
        tone = await analyzeToneFromBusinessInfo(
          business.name,
          business.description,
          business.toneOfVoice
        );
      }
      
      // Update business with analyzed tone
      await updateBusiness(businessId, { toneOfVoice: tone });
      
      // Refresh business data
      const updatedBusiness = await getBusinessById(businessId);
      setBusiness(updatedBusiness);
      
    } catch (error: any) {
      console.error("Error analyzing tone:", error);
      setAnalysisError(error.message || "Failed to analyze tone");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Business not found</p>
        <Link href="/dashboard/businesses" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          Back to Businesses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/businesses"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Businesses
      </Link>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm mt-1"
                >
                  {business.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
          <Link
            href={`/dashboard/businesses/${businessId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
        </div>

        {business.description && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Description</h2>
            <p className="text-gray-600">{business.description}</p>
          </div>
        )}

        {/* Facebook Connection */}
        {business.socialMediaAccounts?.facebook && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Facebook className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-sm font-medium text-gray-700">Facebook Connection</h2>
                  {facebookConnected ? (
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      Connected{facebookPageName && ` • ${facebookPageName}`}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 mt-1">Not connected</p>
                  )}
                </div>
              </div>
              {facebookConnected ? (
                <button
                  onClick={handleDisconnectFacebook}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnectFacebook}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <Facebook className="w-3 h-3" />
                  Connect Facebook
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Connect this business's Facebook page to enable tone analysis from posts and post scheduling.
            </p>
          </div>
        )}

        {/* Tone of Voice */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">Tone of Voice</h2>
            <div className="flex flex-wrap gap-2">
              {business.description && (
                <button
                  onClick={() => handleAnalyzeTone('description')}
                  disabled={analyzing}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Analyze from Description
                    </>
                  )}
                </button>
              )}
              {business.website && (
                <button
                  onClick={() => handleAnalyzeTone('website')}
                  disabled={analyzing}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Analyze from Website
                    </>
                  )}
                </button>
              )}
              {business.socialMediaAccounts?.facebook && (
                <button
                  onClick={() => handleAnalyzeTone('facebook')}
                  disabled={analyzing}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!facebookConnected ? "Connect Facebook first to analyze from posts" : ""}
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Analyze from Facebook
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          {analysisError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {analysisError}
            </div>
          )}
          {business.toneOfVoice ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{business.toneOfVoice}</p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">
                No tone of voice set yet. Click "Analyze" to automatically learn the tone from your business description or website.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
          <Link
            href={`/dashboard/campaigns?business=${businessId}`}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <Briefcase className="w-6 h-6 text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{campaignsCount}</div>
            <div className="text-sm text-gray-600">Campaigns</div>
          </Link>
          <Link
            href={`/dashboard/posts?business=${businessId}`}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <FileText className="w-6 h-6 text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{postsCount}</div>
            <div className="text-sm text-gray-600">Posts</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BusinessDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    }>
      <BusinessDetailContent />
    </Suspense>
  );
}

