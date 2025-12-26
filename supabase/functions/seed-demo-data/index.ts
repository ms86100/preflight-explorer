import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting demo data seed...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get admin user ID
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'admin@test.com')
      .single();

    const adminId = adminProfile?.id;
    if (!adminId) {
      throw new Error('Admin user not found. Run seed-admin-user first.');
    }

    console.log('Found admin user:', adminId);

    // Get issue types
    const { data: issueTypes } = await supabase.from('issue_types').select('id, name');
    const epicType = issueTypes?.find(t => t.name === 'Epic');
    const storyType = issueTypes?.find(t => t.name === 'Story');
    const taskType = issueTypes?.find(t => t.name === 'Task');
    const bugType = issueTypes?.find(t => t.name === 'Bug');

    // Get statuses
    const { data: statuses } = await supabase.from('issue_statuses').select('id, name');
    const todoStatus = statuses?.find(s => s.name === 'To Do');
    const inProgressStatus = statuses?.find(s => s.name === 'In Progress');
    const doneStatus = statuses?.find(s => s.name === 'Done');

    // Get priorities
    const { data: priorities } = await supabase.from('priorities').select('id, name');
    const highPriority = priorities?.find(p => p.name === 'High');
    const mediumPriority = priorities?.find(p => p.name === 'Medium');
    const lowPriority = priorities?.find(p => p.name === 'Low');

    // Clean up existing demo projects
    console.log('Cleaning up existing projects...');
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id')
      .in('pkey', ['PHNX', 'ATLAS', 'NEXUS']);

    if (existingProjects && existingProjects.length > 0) {
      const projectIds = existingProjects.map(p => p.id);
      
      // Delete related data in order
      await supabase.from('sprint_issues').delete().in('sprint_id', 
        (await supabase.from('sprints').select('id').in('board_id',
          (await supabase.from('boards').select('id').in('project_id', projectIds)).data?.map(b => b.id) || []
        )).data?.map(s => s.id) || []
      );
      await supabase.from('sprints').delete().in('board_id',
        (await supabase.from('boards').select('id').in('project_id', projectIds)).data?.map(b => b.id) || []
      );
      await supabase.from('issue_components').delete().in('issue_id',
        (await supabase.from('issues').select('id').in('project_id', projectIds)).data?.map(i => i.id) || []
      );
      await supabase.from('issue_fix_versions').delete().in('issue_id',
        (await supabase.from('issues').select('id').in('project_id', projectIds)).data?.map(i => i.id) || []
      );
      await supabase.from('issues').delete().in('project_id', projectIds);
      await supabase.from('components').delete().in('project_id', projectIds);
      await supabase.from('versions').delete().in('project_id', projectIds);
      await supabase.from('board_columns').delete().in('board_id',
        (await supabase.from('boards').select('id').in('project_id', projectIds)).data?.map(b => b.id) || []
      );
      await supabase.from('boards').delete().in('project_id', projectIds);
      await supabase.from('projects').delete().in('id', projectIds);
    }

    console.log('Creating new demo projects...');

    // Create 3 demo projects
    const projectsData = [
      { name: 'Phoenix Platform', pkey: 'PHNX', description: 'Next-generation enterprise platform with microservices architecture' },
      { name: 'Atlas Marketing', pkey: 'ATLAS', description: 'Marketing automation and campaign management system' },
      { name: 'Nexus API', pkey: 'NEXUS', description: 'Core API gateway and integration services' },
    ];

    const createdProjects: { id: string; pkey: string }[] = [];

    for (const proj of projectsData) {
      const { data: project, error: projErr } = await supabase
        .from('projects')
        .insert({
          name: proj.name,
          pkey: proj.pkey,
          description: proj.description,
          lead_id: adminId,
          project_type: 'software',
        })
        .select()
        .single();

      if (projErr) {
        console.error('Error creating project:', projErr);
        continue;
      }

      createdProjects.push({ id: project.id, pkey: proj.pkey });
      console.log('Created project:', proj.pkey);

      // Create components for each project
      const componentsData = [
        { name: 'Frontend', description: 'User interface and client-side components' },
        { name: 'Backend', description: 'Server-side logic and API endpoints' },
        { name: 'Database', description: 'Data storage and persistence layer' },
        { name: 'Infrastructure', description: 'DevOps, CI/CD, and cloud resources' },
      ];

      const { data: components } = await supabase
        .from('components')
        .insert(componentsData.map(c => ({ ...c, project_id: project.id, lead_id: adminId })))
        .select();

      console.log('Created components for', proj.pkey);

      // Create versions/releases
      const versionsData = [
        { name: 'v1.0.0', description: 'Initial release', status: 'released', release_date: '2024-01-15' },
        { name: 'v1.1.0', description: 'Feature update', status: 'released', release_date: '2024-03-01' },
        { name: 'v2.0.0', description: 'Major release', status: 'unreleased', release_date: '2025-02-01' },
      ];

      const { data: versions } = await supabase
        .from('versions')
        .insert(versionsData.map(v => ({ ...v, project_id: project.id })))
        .select();

      console.log('Created versions for', proj.pkey);

      // Create board
      const { data: board } = await supabase
        .from('boards')
        .insert({
          name: `${proj.name} Board`,
          project_id: project.id,
          board_type: 'scrum',
          owner_id: adminId,
        })
        .select()
        .single();

      if (board) {
        // Create board columns
        await supabase.from('board_columns').insert([
          { board_id: board.id, name: 'To Do', position: 0 },
          { board_id: board.id, name: 'In Progress', position: 1 },
          { board_id: board.id, name: 'Done', position: 2 },
        ]);
      }

      // Create issues with relationships
      const issuesData = [
        // Epic
        { 
          summary: `[${proj.pkey}] Platform Architecture Design`, 
          description: 'Define the overall architecture and technical design for the platform.',
          issue_type_id: epicType?.id,
          priority_id: highPriority?.id,
          status_id: inProgressStatus?.id,
          story_points: 21,
        },
        // Stories
        { 
          summary: 'Implement user authentication flow', 
          description: 'Create login, logout, and session management functionality.',
          issue_type_id: storyType?.id,
          priority_id: highPriority?.id,
          status_id: doneStatus?.id,
          story_points: 8,
        },
        { 
          summary: 'Design responsive dashboard layout', 
          description: 'Create a modern, responsive dashboard with key metrics.',
          issue_type_id: storyType?.id,
          priority_id: mediumPriority?.id,
          status_id: inProgressStatus?.id,
          story_points: 5,
        },
        { 
          summary: 'Build API documentation portal', 
          description: 'Set up Swagger/OpenAPI documentation for all endpoints.',
          issue_type_id: storyType?.id,
          priority_id: mediumPriority?.id,
          status_id: todoStatus?.id,
          story_points: 3,
        },
        // Tasks
        { 
          summary: 'Configure CI/CD pipeline', 
          description: 'Set up automated testing and deployment workflows.',
          issue_type_id: taskType?.id,
          priority_id: highPriority?.id,
          status_id: doneStatus?.id,
          story_points: 3,
        },
        { 
          summary: 'Set up monitoring and alerting', 
          description: 'Implement logging, metrics, and alert notifications.',
          issue_type_id: taskType?.id,
          priority_id: mediumPriority?.id,
          status_id: inProgressStatus?.id,
          story_points: 5,
        },
        { 
          summary: 'Database schema optimization', 
          description: 'Review and optimize database indexes and queries.',
          issue_type_id: taskType?.id,
          priority_id: lowPriority?.id,
          status_id: todoStatus?.id,
          story_points: 3,
        },
        // Bugs
        { 
          summary: 'Fix pagination on large datasets', 
          description: 'Performance issue when loading more than 1000 records.',
          issue_type_id: bugType?.id,
          priority_id: highPriority?.id,
          status_id: inProgressStatus?.id,
          story_points: 2,
        },
        { 
          summary: 'Mobile view layout broken on Safari', 
          description: 'CSS flexbox issues causing layout problems on iOS Safari.',
          issue_type_id: bugType?.id,
          priority_id: mediumPriority?.id,
          status_id: todoStatus?.id,
          story_points: 1,
        },
        { 
          summary: 'Session timeout not working correctly', 
          description: 'Users are not being logged out after inactivity period.',
          issue_type_id: bugType?.id,
          priority_id: lowPriority?.id,
          status_id: doneStatus?.id,
          story_points: 2,
        },
      ];

      const { data: createdIssues, error: issueErr } = await supabase
        .from('issues')
        .insert(issuesData.map(issue => ({
          ...issue,
          project_id: project.id,
          reporter_id: adminId,
          assignee_id: adminId,
        })))
        .select();

      if (issueErr) {
        console.error('Error creating issues:', issueErr);
      } else {
        console.log('Created', createdIssues?.length, 'issues for', proj.pkey);

        // Link issues to components
        if (createdIssues && components) {
          const componentLinks = createdIssues.slice(0, 5).map((issue, idx) => ({
            issue_id: issue.id,
            component_id: components[idx % components.length].id,
          }));

          await supabase.from('issue_components').insert(componentLinks);
          console.log('Created component links for', proj.pkey);
        }

        // Link issues to versions
        if (createdIssues && versions) {
          const versionLinks = createdIssues.slice(0, 6).map((issue, idx) => ({
            issue_id: issue.id,
            version_id: versions[idx % versions.length].id,
          }));

          await supabase.from('issue_fix_versions').insert(versionLinks);
          console.log('Created version links for', proj.pkey);
        }
      }
    }

    console.log('Demo data seed complete!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo data created successfully',
        projects: createdProjects,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Seed demo data error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
