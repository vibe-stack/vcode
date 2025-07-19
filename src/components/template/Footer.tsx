import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";

export default function Footer() {
  const [indexStatus, setIndexStatus] = useState<{
    isBuilt: boolean;
    isBuilding: boolean;
    progress: number;
    message?: string;
  }>({
    isBuilt: false,
    isBuilding: false,
    progress: 0
  });

  useEffect(() => {
    // Check initial index status
    checkIndexStatus();

    // Set up listeners for index progress and completion
    if (window.indexApi) {
      window.indexApi.onProgress((data) => {
        setIndexStatus(prev => ({
          ...prev,
          isBuilding: true,
          progress: data.progress,
          message: data.message
        }));

        // When progress reaches 100%, mark as built
        if (data.progress >= 100) {
          setTimeout(() => {
            setIndexStatus(prev => ({
              ...prev,
              isBuilt: true,
              isBuilding: false,
              progress: 100
            }));
          }, 1000); // Small delay to show completion
        }
      });

      window.indexApi.onError(() => {
        setIndexStatus(prev => ({
          ...prev,
          isBuilding: false,
          progress: 0
        }));
      });
    }

    return () => {
      window.indexApi?.removeAllListeners();
    };
  }, []);

  const checkIndexStatus = async () => {
    try {
      const status = await window.indexApi?.getStatus();
      if (status) {
        setIndexStatus(prev => ({
          ...prev,
          isBuilt: status.isBuilt,
          isBuilding: false
        }));
      }
    } catch (error) {
      console.error('Failed to check index status:', error);
    }
  };

  const renderIndexStatus = () => {
    if (indexStatus.isBuilding) {
      return (
        <span className="text-white">
          Indexing {Math.round(indexStatus.progress)}%
        </span>
      );
    }

    if (indexStatus.isBuilt) {
      return (
        <span className="flex items-center gap-1 text-white">
          <Check className="h-3 w-3" />
          Index
        </span>
      );
    }

    return null;
  };

  return (
    <footer className="font-tomorrow inline-flex justify-between text-[0.7rem] uppercase text-muted-foreground">
      <div></div>
      <div>
        {renderIndexStatus()}
      </div>
    </footer>
  );
}
