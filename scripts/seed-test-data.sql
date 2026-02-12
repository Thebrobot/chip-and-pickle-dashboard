-- Stress Test Data Seeding Script
-- Run this in Supabase SQL Editor to populate your database with realistic test data
-- WARNING: This will add a lot of data to your current project. Use a test project if possible.

-- Note: Replace 'YOUR_PROJECT_ID' and 'YOUR_USER_ID' with actual values from your database
-- You can find these by running: SELECT id FROM projects LIMIT 1; and SELECT user_id FROM profiles LIMIT 1;

-- Variables (UPDATE THESE FIRST!)
DO $$
DECLARE
  v_project_id uuid := 'YOUR_PROJECT_ID'; -- Get from: SELECT id FROM projects LIMIT 1;
  v_user_id uuid := 'YOUR_USER_ID';       -- Get from: SELECT user_id FROM profiles LIMIT 1;
  v_contractor_id uuid;
  v_budget_item_id uuid;
  i integer;
BEGIN

  -- ====================
  -- 1. ADD MORE CONTRACTORS (15 total)
  -- ====================
  INSERT INTO contractors (project_id, name, role, phone, email, notes, status, added_by) VALUES
    (v_project_id, 'Sarah Martinez', 'General Contractor', '555-0101', 'sarah.m@buildco.com', 'Licensed GC with 15+ years experience in commercial sports facilities. Previous work includes 3 pickleball complexes.', 'active', v_user_id),
    (v_project_id, 'Mike Chen', 'Structural Engineer', '555-0102', 'mchen@structureeng.com', 'PE licensed. Specializes in open-span athletic buildings. Available for site visits weekly.', 'active', v_user_id),
    (v_project_id, 'Lisa Thompson', 'HVAC Specialist', '555-0103', 'lisa@coolairpro.com', 'Expert in climate control for large athletic spaces. Can handle high-ceiling ventilation.', 'active', v_user_id),
    (v_project_id, 'David Park', 'Electrical Contractor', '555-0104', 'dpark@sparkelectric.com', 'Master electrician. Experience with sports lighting systems and high-power requirements.', 'active', v_user_id),
    (v_project_id, 'Jennifer Wong', 'Plumbing Contractor', '555-0105', 'jwong@flowplumbing.com', 'Commercial plumbing specialist. Locker room and restroom facility expert.', 'active', v_user_id),
    (v_project_id, 'Robert Taylor', 'Court Surfacing Expert', '555-0106', 'rtaylor@courtsurface.com', 'Certified installer for SportMaster and PickleMaster systems. 50+ courts installed.', 'active', v_user_id),
    (v_project_id, 'Amanda Lee', 'Interior Designer', '555-0107', 'alee@designstudio.com', 'Specializes in sports facility aesthetics and wayfinding. Strong portfolio in entertainment venues.', 'active', v_user_id),
    (v_project_id, 'James Wilson', 'Landscaping Contractor', '555-0108', 'james@greenscapes.com', 'Commercial property landscaping. Parking lot design and stormwater management.', 'pending', v_user_id),
    (v_project_id, 'Maria Garcia', 'Acoustic Engineer', '555-0109', 'mgarcia@soundsolutions.com', 'Critical for indoor court noise management. Can reduce echo by 60%.', 'pending', v_user_id),
    (v_project_id, 'Tom Anderson', 'Fire Safety Inspector', '555-0110', 'tanderson@firesafe.com', 'Required for occupancy permit. Will conduct inspections throughout construction.', 'pending', v_user_id),
    (v_project_id, 'Rachel Kim', 'Permit Expediter', '555-0111', 'rkim@permitpros.com', 'Speeds up city approval process. Connected with local planning department.', 'active', v_user_id),
    (v_project_id, 'Chris Martinez', 'Signage Specialist', '555-0112', 'chris@customsigns.com', 'Indoor/outdoor signage. Branding expert for sports facilities.', 'pending', v_user_id),
    (v_project_id, 'Diana Foster', 'Insurance Consultant', '555-0113', 'diana@riskmanagement.com', 'Commercial property and liability insurance for sports facilities.', 'active', v_user_id),
    (v_project_id, 'Kevin Brown', 'Equipment Supplier', '555-0114', 'kbrown@sportsupply.com', 'Nets, posts, paddles, balls. Volume discounts available. Installation included.', 'active', v_user_id);

  -- ====================
  -- 2. ADD BUDGET ITEMS (50+ items across categories)
  -- ====================
  
  -- Site Preparation
  INSERT INTO budget_items (project_id, category, item_name, forecast_amount, actual_amount, vendor, notes, paid, paid_date) VALUES
    (v_project_id, 'Site Preparation', 'Land Survey', 3500, 3500, 'Precision Surveyors', 'Completed topographic survey. Includes boundary verification and elevation mapping.', true, NOW() - interval '45 days'),
    (v_project_id, 'Site Preparation', 'Geotechnical Study', 8000, 8200, 'SoilTech Engineering', 'Soil bearing capacity test required for foundation design. Report shows good soil conditions.', true, NOW() - interval '40 days'),
    (v_project_id, 'Site Preparation', 'Environmental Assessment', 6500, 0, 'EcoConsult Group', 'Phase I environmental due diligence. Waiting for scheduling.', false, NULL),
    (v_project_id, 'Site Preparation', 'Tree Removal', 12000, 0, 'Clear-Cut Services', 'Remove 8 large trees. Stump grinding included. City permit obtained.', false, NULL),
    (v_project_id, 'Site Preparation', 'Demolition of Existing Structure', 45000, 0, 'Demo Dynamics', 'Old warehouse on northwest corner needs removal. Asbestos abatement included.', false, NULL),
    (v_project_id, 'Site Preparation', 'Site Grading', 35000, 0, 'Earthworks Inc', 'Level 2.3 acres for parking and building pad. 6% slope for drainage.', false, NULL),
    
    -- Permits & Legal
    (v_project_id, 'Permits & Legal', 'Building Permit', 8500, 8500, 'City of [Location]', 'Main building permit approved. Valid for 18 months.', true, NOW() - interval '30 days'),
    (v_project_id, 'Permits & Legal', 'Zoning Variance', 2500, 2500, 'City Planning Dept', 'Variance for parking space count approved.', true, NOW() - interval '60 days'),
    (v_project_id, 'Permits & Legal', 'Impact Fees', 15000, 15000, 'City of [Location]', 'One-time development impact fee for commercial recreation.', true, NOW() - interval '55 days'),
    (v_project_id, 'Permits & Legal', 'Attorney Fees - Contract Review', 4500, 4800, 'Smith & Associates', 'Review of contractor agreements and lease terms.', true, NOW() - interval '50 days'),
    (v_project_id, 'Permits & Legal', 'Title Insurance', 2800, 2800, 'First American Title', 'Owner''s title policy for property protection.', true, NOW() - interval '70 days'),
    
    -- Design & Architecture
    (v_project_id, 'Design & Architecture', 'Architectural Plans', 45000, 22500, 'Jaime Reyes Architects', '50% deposit paid. Final plans due in 3 weeks. 8,000 sq ft facility design.', true, NOW() - interval '20 days'),
    (v_project_id, 'Design & Architecture', 'Structural Engineering', 18000, 0, 'Chen Structural Group', 'Structural calcs for roof span and foundation. Steel frame design.', false, NULL),
    (v_project_id, 'Design & Architecture', 'MEP Engineering', 22000, 0, 'Integrated Systems', 'Mechanical, Electrical, Plumbing design. Energy-efficient HVAC spec.', false, NULL),
    (v_project_id, 'Design & Architecture', 'Landscape Architecture', 8500, 0, 'GreenScape Design', 'Parking lot layout, sidewalks, lighting, and landscaping plan.', false, NULL),
    (v_project_id, 'Design & Architecture', 'Interior Design', 12000, 0, 'Amanda Lee Design Studio', 'Lobby, pro shop, locker rooms, and lounge design. Brand integration.', false, NULL),
    
    -- Foundation
    (v_project_id, 'Foundation', 'Excavation', 28000, 0, 'Big Dig Excavating', 'Dig foundation footprint. 4 ft depth. Includes hauling excess soil.', false, NULL),
    (v_project_id, 'Foundation', 'Concrete Footings', 35000, 0, 'SolidBase Concrete', '3000 PSI concrete. Reinforced steel. Perimeter and column footings.', false, NULL),
    (v_project_id, 'Foundation', 'Foundation Walls', 42000, 0, 'SolidBase Concrete', '8" concrete block walls with waterproofing membrane.', false, NULL),
    (v_project_id, 'Foundation', 'Underslab Plumbing', 18000, 0, 'FlowPro Plumbing', 'Water lines, drains, and sewer connections under slab.', false, NULL),
    (v_project_id, 'Foundation', 'Underslab Electrical', 12000, 0, 'Spark Electric', 'Conduit runs for power and data. Ground grid installation.', false, NULL),
    
    -- Structure
    (v_project_id, 'Structure', 'Steel Building Package', 285000, 0, 'American Steel Buildings', 'Pre-engineered metal building. 100x160 ft clear span. 22 ft eave height. Includes erection.', false, NULL),
    (v_project_id, 'Structure', 'Concrete Slab', 65000, 0, 'SolidBase Concrete', '6" slab on grade. Laser-leveled for court installation. Polished finish in common areas.', false, NULL),
    (v_project_id, 'Structure', 'Roof System', 85000, 0, 'American Steel Buildings', 'Standing seam metal roof. R-30 insulation. Includes skylights for natural light.', false, NULL),
    (v_project_id, 'Structure', 'Exterior Wall Panels', 45000, 0, 'American Steel Buildings', 'Insulated metal panels. Color: Charcoal with accent panels in brand colors.', false, NULL),
    (v_project_id, 'Structure', 'Windows & Doors', 38000, 0, 'Commercial Door Supply', '2 overhead doors, entry doors, emergency exits. Impact-rated glass.', false, NULL),
    
    -- Mechanical/HVAC
    (v_project_id, 'Mechanical/HVAC', 'HVAC Units', 95000, 0, 'CoolAir Pro Systems', '4 rooftop units. Variable speed. Designed for high-ceiling sports facility.', false, NULL),
    (v_project_id, 'Mechanical/HVAC', 'Ductwork & Installation', 42000, 0, 'CoolAir Pro Systems', 'Supply and return ducts. Diffusers optimized to minimize court airflow.', false, NULL),
    (v_project_id, 'Mechanical/HVAC', 'Ventilation Fans', 8500, 0, 'CoolAir Pro Systems', 'Exhaust fans for locker rooms and restrooms. Code compliant.', false, NULL),
    
    -- Electrical
    (v_project_id, 'Electrical', 'Main Service Panel', 18000, 0, 'Spark Electric', '600 amp service. 3-phase power for HVAC and lighting loads.', false, NULL),
    (v_project_id, 'Electrical', 'Court Lighting - LED', 52000, 0, 'Spark Electric', 'Professional-grade LED court lights. 75 foot-candles at court surface. Dimmable.', false, NULL),
    (v_project_id, 'Electrical', 'Interior Lighting', 22000, 0, 'Spark Electric', 'LED lighting for lobby, locker rooms, offices. Motion sensors in restrooms.', false, NULL),
    (v_project_id, 'Electrical', 'Exterior Lighting', 15000, 0, 'Spark Electric', 'Parking lot lighting and building exterior. LED with photocells.', false, NULL),
    (v_project_id, 'Electrical', 'Power Outlets & Data', 12000, 0, 'Spark Electric', 'Outlets throughout facility. Cat6 data drops for WiFi access points and POS.', false, NULL),
    (v_project_id, 'Electrical', 'Emergency Lighting', 6500, 0, 'Spark Electric', 'Battery backup emergency lights. Exit signs. Code required.', false, NULL),
    
    -- Plumbing
    (v_project_id, 'Plumbing', 'Water Service Connection', 12000, 0, 'FlowPro Plumbing', 'Connect to city main. 3" service line. Backflow preventer included.', false, NULL),
    (v_project_id, 'Plumbing', 'Sewer Connection', 15000, 0, 'FlowPro Plumbing', 'Connect to city sewer. Grease trap for café area.', false, NULL),
    (v_project_id, 'Plumbing', 'Restroom Fixtures', 28000, 0, 'FlowPro Plumbing', '6 toilets, 4 urinals, 8 sinks. Commercial grade. ADA compliant.', false, NULL),
    (v_project_id, 'Plumbing', 'Locker Room Showers', 18000, 0, 'FlowPro Plumbing', '4 shower stalls per locker room. Tile surrounds. Drain system.', false, NULL),
    (v_project_id, 'Plumbing', 'Water Heaters', 8500, 0, 'FlowPro Plumbing', '2 commercial tankless water heaters. Adequate for shower loads.', false, NULL),
    (v_project_id, 'Plumbing', 'Drinking Fountains', 4500, 0, 'FlowPro Plumbing', '4 bottle-filling stations. ADA accessible.', false, NULL),
    
    -- Courts
    (v_project_id, 'Courts', 'Court Surfacing - 6 Courts', 45000, 3732, 'Court Surface Pro', 'DIY option no longer viable. Professional install required. Color: tournament blue/green.', true, NOW() - interval '10 days'),
    (v_project_id, 'Courts', 'Court Lines & Graphics', 8500, 0, 'Court Surface Pro', 'Precision line striping. Custom logo at center court.', false, NULL),
    (v_project_id, 'Courts', 'Net Systems', 3600, 0, 'SportsEquip Supply', '6 professional net systems. Portable bases. Tournament grade.', false, NULL),
    (v_project_id, 'Courts', 'Court Divider Curtains', 12000, 0, 'Gym Dividers Inc', 'Motorized divider curtains between courts. Reduces noise and ball interference.', false, NULL),
    (v_project_id, 'Courts', 'Perimeter Fencing', 8500, 0, 'FencePro', '10 ft high vinyl-coated chain link around court area. Safety barrier.', false, NULL),
    
    -- Interior Finishes
    (v_project_id, 'Interior Finishes', 'Drywall - Offices/Locker Rooms', 35000, 0, 'ProFinish Drywall', 'Moisture-resistant drywall in wet areas. Tape, mud, prime, paint.', false, NULL),
    (v_project_id, 'Interior Finishes', 'Painting', 18000, 0, 'ColorWorks Painting', 'Interior paint. Brand colors in lobby. Neutral in locker rooms.', false, NULL),
    (v_project_id, 'Interior Finishes', 'Flooring - Lobby', 12000, 0, 'FloorPro', 'Luxury vinyl tile. Durable and easy to maintain. Slip-resistant.', false, NULL),
    (v_project_id, 'Interior Finishes', 'Flooring - Locker Rooms', 8500, 0, 'FloorPro', 'Ceramic tile. Wet area rated. Heated floors in shower areas.', false, NULL),
    (v_project_id, 'Interior Finishes', 'Ceiling Tiles - Offices', 6500, 0, 'ProFinish Drywall', 'Acoustic drop ceiling tiles. 2x4 grid. White.', false, NULL);

  -- ====================
  -- 3. ADD MANY TASKS (40+ tasks)
  -- ====================
  
  -- Past tasks (completed)
  INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_user_id, created_by) VALUES
    (v_project_id, 'Complete land survey', 'Hire surveyor to create topographic map and boundary verification', 'done', 'high', NOW() - interval '50 days', v_user_id, v_user_id),
    (v_project_id, 'Submit zoning variance application', 'Apply for parking space variance with city planning', 'done', 'high', NOW() - interval '65 days', v_user_id, v_user_id),
    (v_project_id, 'Secure property insurance', 'Get builder''s risk insurance policy in place', 'done', 'medium', NOW() - interval '55 days', v_user_id, v_user_id),
    (v_project_id, 'Sign architect contract', 'Execute agreement with Jaime Reyes for design services', 'done', 'high', NOW() - interval '25 days', v_user_id, v_user_id),
    (v_project_id, 'Order geotechnical study', 'Schedule soil boring tests for foundation design', 'done', 'high', NOW() - interval '45 days', v_user_id, v_user_id),
    
    -- Current week (urgent)
    (v_project_id, 'Review final architectural plans', 'Jaime submitting final plans this week - review for approval', 'in_progress', 'high', NOW() + interval '2 days', v_user_id, v_user_id),
    (v_project_id, 'Approve structural engineer proposal', 'Chen Structural quote needs approval to start calcs', 'todo', 'high', NOW() + interval '3 days', v_user_id, v_user_id),
    (v_project_id, 'Schedule environmental assessment', 'EcoConsult needs site access for Phase I study', 'todo', 'high', NOW() + interval '4 days', v_user_id, v_user_id),
    (v_project_id, 'Finalize steel building color selection', 'Choose exterior panel colors for American Steel order', 'todo', 'medium', NOW() + interval '5 days', v_user_id, v_user_id),
    
    -- Next 2 weeks
    (v_project_id, 'Obtain tree removal permit', 'Submit application to city forestry department', 'todo', 'medium', NOW() + interval '8 days', v_user_id, v_user_id),
    (v_project_id, 'Schedule pre-construction meeting', 'Coordinate all contractors for project kickoff', 'todo', 'high', NOW() + interval '10 days', v_user_id, v_user_id),
    (v_project_id, 'Order HVAC equipment', 'Long lead time - place order for rooftop units', 'todo', 'high', NOW() + interval '12 days', v_user_id, v_user_id),
    (v_project_id, 'Approve MEP engineering drawings', 'Review mechanical, electrical, plumbing designs', 'todo', 'medium', NOW() + interval '14 days', v_user_id, v_user_id),
    (v_project_id, 'Finalize interior color palette', 'Meet with Amanda Lee to select paint and finish colors', 'todo', 'low', NOW() + interval '15 days', v_user_id, v_user_id),
    (v_project_id, 'Submit parking lot permit', 'Separate permit required for paving and striping', 'todo', 'medium', NOW() + interval '16 days', v_user_id, v_user_id),
    
    -- Next month
    (v_project_id, 'Schedule demolition start date', 'Coordinate Demo Dynamics for old warehouse removal', 'todo', 'medium', NOW() + interval '25 days', v_user_id, v_user_id),
    (v_project_id, 'Order LED court lighting', 'Spark Electric needs 6-week lead time for fixtures', 'todo', 'high', NOW() + interval '28 days', v_user_id, v_user_id),
    (v_project_id, 'Finalize restroom fixture selections', 'Choose toilets, sinks, accessories for plumber order', 'todo', 'low', NOW() + interval '30 days', v_user_id, v_user_id),
    (v_project_id, 'Schedule utility connections', 'Coordinate with city for water and sewer connection dates', 'todo', 'medium', NOW() + interval '35 days', v_user_id, v_user_id),
    (v_project_id, 'Order court net systems', 'SportsEquip needs order for 6 professional net setups', 'todo', 'medium', NOW() + interval '38 days', v_user_id, v_user_id),
    
    -- Future tasks
    (v_project_id, 'Excavation and site grading', 'Begin earthwork - level building pad and parking area', 'todo', 'high', NOW() + interval '45 days', v_user_id, v_user_id),
    (v_project_id, 'Pour foundation footings', 'SolidBase to pour concrete footings and walls', 'todo', 'high', NOW() + interval '52 days', v_user_id, v_user_id),
    (v_project_id, 'Steel building erection', 'American Steel to erect metal building frame', 'todo', 'high', NOW() + interval '65 days', v_user_id, v_user_id),
    (v_project_id, 'Roofing installation', 'Complete standing seam roof and skylight installation', 'todo', 'high', NOW() + interval '72 days', v_user_id, v_user_id),
    (v_project_id, 'Exterior wall panel installation', 'Install insulated metal panels on building exterior', 'todo', 'medium', NOW() + interval '75 days', v_user_id, v_user_id),
    (v_project_id, 'Pour concrete slab', 'Laser-leveled slab for court installation', 'todo', 'high', NOW() + interval '80 days', v_user_id, v_user_id),
    (v_project_id, 'Rough-in plumbing', 'Install all water lines, drains, and waste lines', 'todo', 'high', NOW() + interval '85 days', v_user_id, v_user_id),
    (v_project_id, 'Rough-in electrical', 'Install conduit, wire, panels, and boxes', 'todo', 'high', NOW() + interval '88 days', v_user_id, v_user_id),
    (v_project_id, 'Install HVAC ductwork', 'Complete supply and return duct installation', 'todo', 'high', NOW() + interval '92 days', v_user_id, v_user_id),
    (v_project_id, 'Frame interior walls', 'Build office and locker room wall framing', 'todo', 'medium', NOW() + interval '95 days', v_user_id, v_user_id),
    (v_project_id, 'Install drywall', 'Hang, tape, and mud all interior walls', 'todo', 'medium', NOW() + interval '100 days', v_user_id, v_user_id),
    (v_project_id, 'Install court surface', 'Court Surface Pro to install acrylic coating system', 'todo', 'high', NOW() + interval '105 days', v_user_id, v_user_id),
    (v_project_id, 'Stripe court lines', 'Precision line striping and custom logo graphics', 'todo', 'high', NOW() + interval '108 days', v_user_id, v_user_id),
    (v_project_id, 'Install restroom fixtures', 'Toilets, sinks, showers, and accessories', 'todo', 'medium', NOW() + interval '110 days', v_user_id, v_user_id),
    (v_project_id, 'Install lighting fixtures', 'Court lights, interior lights, and emergency lighting', 'todo', 'high', NOW() + interval '112 days', v_user_id, v_user_id),
    (v_project_id, 'Paint interior', 'All walls and ceilings in offices and common areas', 'todo', 'medium', NOW() + interval '115 days', v_user_id, v_user_id),
    (v_project_id, 'Install flooring', 'LVT in lobby, tile in locker rooms', 'todo', 'medium', NOW() + interval '118 days', v_user_id, v_user_id),
    (v_project_id, 'Install doors and hardware', 'All interior and exterior doors with locks', 'todo', 'medium', NOW() + interval '120 days', v_user_id, v_user_id),
    (v_project_id, 'Parking lot paving', 'Asphalt paving and striping for 75 spaces', 'todo', 'medium', NOW() + interval '125 days', v_user_id, v_user_id),
    (v_project_id, 'Landscape installation', 'Trees, shrubs, irrigation, and mulch', 'todo', 'low', NOW() + interval '128 days', v_user_id, v_user_id),
    (v_project_id, 'Install signage', 'Exterior building sign and wayfinding', 'todo', 'low', NOW() + interval '130 days', v_user_id, v_user_id),
    (v_project_id, 'Final inspections', 'Building, electrical, plumbing, fire, and occupancy', 'todo', 'high', NOW() + interval '135 days', v_user_id, v_user_id),
    (v_project_id, 'Punch list completion', 'Address all contractor punch list items', 'todo', 'high', NOW() + interval '140 days', v_user_id, v_user_id);

  -- ====================
  -- Summary
  -- ====================
  RAISE NOTICE 'Test data seeding complete!';
  RAISE NOTICE 'Added: 14 contractors, 50+ budget items, 42 tasks';
  RAISE NOTICE 'Budget total (forecast): ~$1.8 million';
  RAISE NOTICE 'Tasks span past, present, and future timeline';

END $$;
