<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use App\Models\Volunteer;
use App\Models\DonorProfile;
use App\Models\Program;
use App\Models\Event;
use App\Models\Donation;
use App\Models\Expense;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $roles = ['super-admin', 'org-admin', 'coordinator', 'volunteer', 'donor', 'accountant', 'auditor'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // Create default organization
        $org = Organization::firstOrCreate(
            ['slug' => 'hope-foundation'],
            [
                'name' => 'Hope Foundation NGO',
                'description' => 'Empowering communities through volunteer action and donor generosity.',
                'email' => 'admin@hopefoundation.org',
                'phone' => '+91 98765 43210',
                'website' => 'https://hopefoundation.org',
                'address' => '123 Charity Lane, Welfare District',
                'city' => 'Chennai',
                'state' => 'Tamil Nadu',
                'country' => 'India',
                'pincode' => '600001',
                'registration_number' => 'NGO-TN-2020-12345',
                'is_active' => true,
            ]
        );

        // Create Super Admin
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@volunteerhub.org'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('Admin@1234'),
                'organization_id' => $org->id,
                'phone' => '+91 98765 00001',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $superAdmin->assignRole('super-admin');

        // Create Org Admin
        $orgAdmin = User::firstOrCreate(
            ['email' => 'orgadmin@hopefoundation.org'],
            [
                'name' => 'Priya Sharma',
                'password' => Hash::make('Admin@1234'),
                'organization_id' => $org->id,
                'phone' => '+91 98765 00002',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $orgAdmin->assignRole('org-admin');

        // Create Coordinator
        $coordinator = User::firstOrCreate(
            ['email' => 'coordinator@hopefoundation.org'],
            [
                'name' => 'Rahul Verma',
                'password' => Hash::make('Admin@1234'),
                'organization_id' => $org->id,
                'phone' => '+91 98765 00003',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $coordinator->assignRole('coordinator');

        // Create sample volunteers
        $volunteerData = [
            ['name' => 'Arun Kumar', 'email' => 'arun@example.com', 'skills' => 'Teaching, First Aid'],
            ['name' => 'Meena Iyer', 'email' => 'meena@example.com', 'skills' => 'Cooking, Event Management'],
            ['name' => 'Suresh Raj', 'email' => 'suresh@example.com', 'skills' => 'IT Support, Photography'],
            ['name' => 'Lakshmi Nair', 'email' => 'lakshmi@example.com', 'skills' => 'Medical, Counseling'],
            ['name' => 'Vijay Mohan', 'email' => 'vijay@example.com', 'skills' => 'Logistics, Driving'],
        ];

        foreach ($volunteerData as $i => $vd) {
            $user = User::firstOrCreate(
                ['email' => $vd['email']],
                [
                    'name' => $vd['name'],
                    'password' => Hash::make('Password@123'),
                    'organization_id' => $org->id,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );
            $user->assignRole('volunteer');

            Volunteer::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'organization_id' => $org->id,
                    'volunteer_id' => 'VOL-' . strtoupper(Str::random(8)),
                    'skills' => $vd['skills'],
                    'status' => 'active',
                    'is_verified' => true,
                    'total_hours' => rand(10, 200),
                    'joined_date' => now()->subMonths(rand(1, 24)),
                ]
            );
        }

        // Create sample programs
        $programs = [
            [
                'name' => 'Education for All',
                'description' => 'Providing quality education to underprivileged children in rural areas.',
                'budget' => 500000,
                'status' => 'active',
                'start_date' => now()->subMonths(6),
                'end_date' => now()->addMonths(6),
            ],
            [
                'name' => 'Clean Water Initiative',
                'description' => 'Ensuring access to clean drinking water in drought-affected villages.',
                'budget' => 300000,
                'status' => 'active',
                'start_date' => now()->subMonths(3),
                'end_date' => now()->addMonths(9),
            ],
            [
                'name' => 'Health & Wellness Camp',
                'description' => 'Free medical checkups and health awareness programs.',
                'budget' => 200000,
                'status' => 'completed',
                'start_date' => now()->subMonths(8),
                'end_date' => now()->subMonths(2),
            ],
        ];

        $createdPrograms = [];
        foreach ($programs as $pd) {
            $program = Program::firstOrCreate(
                ['slug' => Str::slug($pd['name']) . '-' . $org->id],
                array_merge($pd, ['organization_id' => $org->id, 'slug' => Str::slug($pd['name']) . '-' . $org->id])
            );
            $createdPrograms[] = $program;
        }

        // Create sample events
        $events = [
            ['title' => 'Book Distribution Drive', 'program_id' => $createdPrograms[0]->id, 'start_datetime' => now()->addDays(7), 'end_datetime' => now()->addDays(7)->addHours(4), 'volunteer_needed' => 10],
            ['title' => 'Water Pipeline Survey', 'program_id' => $createdPrograms[1]->id, 'start_datetime' => now()->addDays(14), 'end_datetime' => now()->addDays(14)->addHours(6), 'volunteer_needed' => 5],
            ['title' => 'Community Health Fair', 'program_id' => $createdPrograms[2]->id, 'start_datetime' => now()->subDays(30), 'end_datetime' => now()->subDays(30)->addHours(8), 'volunteer_needed' => 15],
        ];

        foreach ($events as $ed) {
            Event::firstOrCreate(
                ['title' => $ed['title'], 'organization_id' => $org->id],
                array_merge($ed, ['organization_id' => $org->id, 'status' => $ed['start_datetime']->isFuture() ? 'upcoming' : 'completed', 'location' => 'Chennai, Tamil Nadu'])
            );
        }

        // Create sample donors
        $donorData = [
            ['name' => 'Rajesh Corporation', 'email' => 'csr@rajesh.com', 'donor_type' => 'corporate', 'total_donated' => 150000],
            ['name' => 'Dr. Anita Rajan', 'email' => 'anita.r@gmail.com', 'donor_type' => 'individual', 'total_donated' => 50000],
            ['name' => 'Sunrise Trust', 'email' => 'info@sunrise.org', 'donor_type' => 'trust', 'total_donated' => 250000],
            ['name' => 'Anonymous Donor', 'email' => null, 'donor_type' => 'individual', 'total_donated' => 10000, 'is_anonymous' => true],
        ];

        $createdDonors = [];
        foreach ($donorData as $dd) {
            $donor = DonorProfile::firstOrCreate(
                ['donor_id' => 'DON-' . strtoupper(Str::random(8))],
                array_merge($dd, [
                    'organization_id' => $org->id,
                    'donor_id' => 'DON-' . strtoupper(Str::random(8)),
                    'is_anonymous' => $dd['is_anonymous'] ?? false,
                ])
            );
            $createdDonors[] = $donor;
        }

        // Create sample donations
        $donationAmounts = [50000, 75000, 100000, 25000, 150000, 30000];
        foreach ($donationAmounts as $i => $amount) {
            Donation::create([
                'donor_profile_id' => $createdDonors[$i % count($createdDonors)]->id,
                'organization_id' => $org->id,
                'program_id' => $createdPrograms[$i % count($createdPrograms)]->id,
                'receipt_number' => 'REC-' . date('Y') . '-' . strtoupper(Str::random(8)),
                'amount' => $amount,
                'donation_type' => ['cash', 'online', 'bank_transfer', 'cheque', 'upi'][$i % 5],
                'status' => 'completed',
                'donation_date' => now()->subMonths(rand(0, 5))->subDays(rand(0, 30)),
                'purpose' => 'General donation for ' . $createdPrograms[$i % count($createdPrograms)]->name,
                'is_tax_exempted' => true,
            ]);
        }

        // Create sample expenses
        $expenseData = [
            ['title' => 'School Books Purchase', 'amount' => 45000, 'category' => 'materials', 'program_id' => $createdPrograms[0]->id],
            ['title' => 'Water Testing Equipment', 'amount' => 28000, 'category' => 'equipment', 'program_id' => $createdPrograms[1]->id],
            ['title' => 'Medical Supplies', 'amount' => 35000, 'category' => 'materials', 'program_id' => $createdPrograms[2]->id],
            ['title' => 'Volunteer Transport', 'amount' => 12000, 'category' => 'transport', 'program_id' => $createdPrograms[0]->id],
            ['title' => 'Awareness Campaign Materials', 'amount' => 18000, 'category' => 'marketing', 'program_id' => $createdPrograms[1]->id],
        ];

        foreach ($expenseData as $ed) {
            Expense::create(array_merge($ed, [
                'organization_id' => $org->id,
                'user_id' => $coordinator->id,
                'description' => 'Expense for program activities',
                'expense_date' => now()->subDays(rand(1, 60)),
                'status' => 'approved',
                'approved_by' => $orgAdmin->name,
                'approved_at' => now()->subDays(rand(1, 30)),
            ]));
        }

        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('📧 Super Admin: admin@volunteerhub.org | Password: Admin@1234');
        $this->command->info('📧 Org Admin: orgadmin@hopefoundation.org | Password: Admin@1234');
        $this->command->info('📧 Coordinator: coordinator@hopefoundation.org | Password: Admin@1234');
    }
}
