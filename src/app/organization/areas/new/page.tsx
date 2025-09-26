"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAreaSchema } from "@/lib/validation";
import type { z } from "zod";

type CreateAreaFormData = z.infer<typeof createAreaSchema>;

export default function NewAreaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sites, setSites] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAreaFormData>({
    resolver: zodResolver(createAreaSchema),
    defaultValues: {
      type: "PANTRY",
      isActive: true,
    },
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await fetch("/api/sites");
      const result = await response.json();
      if (result.success) {
        setSites(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch sites:", error);
    }
  };

  const onSubmit = async (data: CreateAreaFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/areas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create area");
      } else {
        router.push("/organization/setup");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Area</h1>
              <p className="text-gray-600">Add a new area within a site (Pantry, Housekeeping, etc.)</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/organization/setup"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Setup
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Area Details</h3>
            <p className="text-sm text-gray-500">
              Create a new area to organize supplies within a site
            </p>
          </div>

          <form className="p-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="siteId" className="block text-sm font-medium text-gray-700">
                Site *
              </label>
              <div className="mt-1">
                <select
                  {...register("siteId")}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a site</option>
                  {sites.map((site: any) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
                {errors.siteId && (
                  <p className="mt-1 text-sm text-red-600">{errors.siteId.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Area Name *
              </label>
              <div className="mt-1">
                <input
                  {...register("name")}
                  type="text"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Main Pantry, Kitchen Storage, etc."
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Area Type *
              </label>
              <div className="mt-1">
                <select
                  {...register("type")}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="PANTRY">Pantry</option>
                  <option value="HOUSEKEEPING">Housekeeping</option>
                  <option value="STATIONERY">Stationery</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Choose the type that best describes this area
              </p>
            </div>

            <div className="flex items-center">
              <input
                {...register("isActive")}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Area is active
              </label>
              <p className="ml-2 text-xs text-gray-500">
                (Inactive areas won't be available for creating requests)
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Area Types Explained
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Pantry:</strong> Food items, beverages, snacks</li>
                      <li><strong>Housekeeping:</strong> Cleaning supplies, maintenance items</li>
                      <li><strong>Stationery:</strong> Office supplies, paper, pens, printer items</li>
                      <li><strong>Other:</strong> Equipment, miscellaneous items</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {sites.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      No Sites Available
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>You need to create at least one site before adding areas.</p>
                      <Link
                        href="/organization/sites/new"
                        className="font-medium underline hover:text-yellow-600"
                      >
                        Create your first site
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Link
                href="/organization/setup"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading || sites.length === 0}
                className="bg-green-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Create Area"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}