"use client";

import { SocialPost } from "@/lib/firebase/posts";
import { Facebook, Instagram, Twitter, Linkedin, Image as ImageIcon } from "lucide-react";

interface PostPreviewProps {
  post: {
    content: string;
    platform: string;
    mediaUrls?: string[];
  };
  className?: string;
}

const PLATFORM_LIMITS = {
  facebook: { maxChars: 5000, recommended: 40 },
  instagram: { maxChars: 2200, recommended: 125 },
  twitter: { maxChars: 280, recommended: 280 },
  linkedin: { maxChars: 3000, recommended: 150 },
};

export default function PostPreview({ post, className = "" }: PostPreviewProps) {
  const { content, platform, mediaUrls = [] } = post;
  const limits = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS] || PLATFORM_LIMITS.facebook;
  const charCount = content.length;
  const isOverLimit = charCount > limits.maxChars;
  const isNearLimit = charCount > limits.maxChars * 0.9;

  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return <Facebook className="w-5 h-5" />;
      case "instagram":
        return <Instagram className="w-5 h-5" />;
      case "twitter":
        return <Twitter className="w-5 h-5" />;
      case "linkedin":
        return <Linkedin className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getPlatformColor = () => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return "bg-blue-600";
      case "instagram":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "twitter":
        return "bg-sky-500";
      case "linkedin":
        return "bg-blue-700";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className={`bg-white rounded-lg border-2 border-gray-200 shadow-lg overflow-hidden ${className}`}>
      {/* Platform Header */}
      <div className={`${getPlatformColor()} text-white px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {getPlatformIcon()}
          <span className="font-semibold capitalize">{platform}</span>
        </div>
        <span className="text-xs opacity-90">
          {charCount} / {limits.maxChars} characters
        </span>
      </div>

      {/* Post Content */}
      <div className="p-4 space-y-4">
        {/* Character Count Warning */}
        {isOverLimit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm font-medium">
              ⚠️ Post exceeds {platform} character limit ({limits.maxChars} characters)
            </p>
            <p className="text-red-600 text-xs mt-1">
              Your post is {charCount - limits.maxChars} characters too long
            </p>
          </div>
        )}
        {isNearLimit && !isOverLimit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              ⚠️ Post is near the character limit ({Math.round((charCount / limits.maxChars) * 100)}% used)
            </p>
          </div>
        )}

        {/* Images Preview */}
        {mediaUrls.length > 0 && (
          <div className={`grid gap-2 ${mediaUrls.length === 1 ? "grid-cols-1" : mediaUrls.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {mediaUrls.slice(0, 9).map((url, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 8 && mediaUrls.length > 9 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-bold">
                    +{mediaUrls.length - 9}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text Content */}
        <div className="min-h-[100px]">
          {content ? (
            <div className="whitespace-pre-wrap break-words text-gray-900">
              {content}
            </div>
          ) : (
            <p className="text-gray-400 italic">No content yet...</p>
          )}
        </div>

        {/* Platform-specific formatting hints */}
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {platform === "twitter" && "💡 Twitter posts are best when concise and engaging"}
            {platform === "instagram" && "💡 Instagram posts work well with emojis and line breaks"}
            {platform === "facebook" && "💡 Facebook posts can be longer and more conversational"}
            {platform === "linkedin" && "💡 LinkedIn posts should be professional and informative"}
          </p>
        </div>
      </div>
    </div>
  );
}

