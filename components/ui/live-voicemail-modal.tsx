"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Settings, Phone, Globe } from "lucide-react";

interface LiveVoicemailModalProps {
  children: React.ReactNode;
}

export function LiveVoicemailModal({ children }: LiveVoicemailModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            iOS 18 Live Voicemail Issue
          </DialogTitle>
          <DialogDescription className="text-base">
            If you have an iPhone with iOS 18, you need to turn off Live
            Voicemail before using call forwarding codes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-800 mb-1">
                  Important for iPhone Users
                </h3>
                <p className="text-orange-700 text-sm">
                  iOS 18&apos;s Live Voicemail feature can block conditional
                  call forwarding. You must disable it before entering
                  forwarding codes.
                </p>
              </div>
            </div>
          </div>

          {/* Method 1 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Method 1: Direct Deactivation (Primary Method)
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <span className="font-medium">Open Settings</span>
                    <p className="text-gray-600 mt-1">
                      Tap the Settings app on your iPhone&apos;s home screen
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <span className="font-medium">Find Phone Settings</span>
                    <p className="text-gray-600 mt-1">
                      Scroll down and tap on <strong>&quot;Apps&quot;</strong>,
                      then <strong>&quot;Phone&quot;</strong>
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <span className="font-medium">Access Live Voicemail</span>
                    <p className="text-gray-600 mt-1">
                      Look for <strong>&quot;Live Voicemail&quot;</strong>{" "}
                      option
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <span className="font-medium">Turn Off Live Voicemail</span>
                    <p className="text-gray-600 mt-1">
                      Toggle the <strong>Live Voicemail</strong> switch to{" "}
                      <strong>OFF</strong>
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Method 2 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              Method 2: Region Settings (If Live Voicemail Option Doesn&apos;t
              Appear)
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-600 mb-3">
                If you don&apos;t see the Live Voicemail toggle, the feature may
                not be available in your current region.
              </p>

              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <span className="font-medium">Go to General Settings</span>
                    <p className="text-gray-600 mt-1">
                      Tap on <strong>&quot;General&quot;</strong> in Settings
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <span className="font-medium">
                      Select Language & Region
                    </span>
                    <p className="text-gray-600 mt-1">
                      Tap on <strong>&quot;Language &amp; Region&quot;</strong>
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <span className="font-medium">Change Region</span>
                    <p className="text-gray-600 mt-1">
                      Change your region to{" "}
                      <strong>&quot;United States&quot;</strong> or{" "}
                      <strong>&quot;United Kingdom&quot;</strong>
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <span className="font-medium">
                      Return to Phone Settings
                    </span>
                    <p className="text-gray-600 mt-1">
                      Go back to Phone settings and follow Method 1 steps
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Important Notes
            </h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>
                • Live Voicemail is <strong>enabled by default</strong> on iOS
                18
              </li>
              <li>
                • This feature can interfere with conditional call forwarding
                services
              </li>
              <li>
                • The feature is only supported in certain regions (US and UK
                confirmed)
              </li>
              <li>
                • After deactivating Live Voicemail, your conditional call
                forwarding should work normally
              </li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              Troubleshooting
            </h3>
            <p className="text-gray-700 text-sm">
              If you still don&apos;t see the Live Voicemail option after
              changing regions, it may indicate that:
            </p>
            <ul className="text-gray-600 text-sm mt-2 space-y-1">
              <li>• Your region doesn&apos;t support this feature</li>
              <li>• Your carrier doesn&apos;t support Live Voicemail</li>
              <li>
                • You may need to restart your iPhone after changing region
                settings
              </li>
            </ul>
          </div>

          {/* Non-iPhone Users */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">
              Not an iPhone User?
            </h3>
            <p className="text-green-700 text-sm">
              If you don&apos;t have an iPhone, you can ignore this warning and
              proceed with entering your call forwarding codes.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
