import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Download } from 'lucide-react';

export default function ReportsPage() {
  const { data: volunteerReport, isLoading: volLoading } = useQuery({
    queryKey: ['report-volunteers'],
    queryFn: async () => (await api.get('/reports/volunteers/hours')).data,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Generate and export detailed reports for your organization
        </p>
      </div>

      {/* Volunteer Hours Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Volunteer Hours Summary</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                  Volunteer
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                  Email
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                  Total Hours
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3">
                  Volunteer ID
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {volLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                volunteerReport?.data?.map(
                  (v: {
                    volunteer_id: string;
                    name: string;
                    email: string;
                    total_hours: number;
                    status: string;
                  }) => (
                    <tr
                      key={v.volunteer_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {v.name}
                      </td>

                      <td className="px-6 py-3 text-sm text-gray-500">
                        {v.email}
                      </td>

                      <td className="px-6 py-3 text-sm font-bold text-rose-600">
                        {Number(v.total_hours ?? 0).toFixed(1)}h
                      </td>

                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            v.status === 'active'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>

                      <td className="px-6 py-3 text-xs font-mono text-gray-500">
                        {v.volunteer_id}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}