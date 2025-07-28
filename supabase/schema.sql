-- BinQR Database Schema
-- Run this in your Supabase SQL editor to create the tables

-- Enable RLS (Row Level Security)
alter default privileges revoke execute on functions from public;

-- Create locations table
create table if not exists public.locations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create boxes table
create table if not exists public.boxes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  qr_code text not null unique,
  image_url text,
  location_id uuid references public.locations(id) on delete restrict,
  ai_analysis text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create box_contents table
create table if not exists public.box_contents (
  id uuid default gen_random_uuid() primary key,
  box_id uuid references public.boxes(id) on delete cascade,
  content text not null,
  category text,
  quantity integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists boxes_qr_code_idx on public.boxes(qr_code);
create index if not exists boxes_location_id_idx on public.boxes(location_id);
create index if not exists box_contents_box_id_idx on public.box_contents(box_id);
create index if not exists box_contents_content_idx on public.box_contents using gin(to_tsvector('english', content));

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for boxes updated_at
create trigger handle_boxes_updated_at
  before update on public.boxes
  for each row
  execute function public.handle_updated_at();

-- Enable Row Level Security
alter table public.locations enable row level security;
alter table public.boxes enable row level security;
alter table public.box_contents enable row level security;

-- Create policies for public access (since we're not using auth yet)
-- In production, you'd want to restrict these based on authenticated users

create policy "Anyone can view locations" on public.locations
  for select using (true);

create policy "Anyone can insert locations" on public.locations
  for insert with check (true);

create policy "Anyone can update locations" on public.locations
  for update using (true);

create policy "Anyone can delete locations" on public.locations
  for delete using (true);

create policy "Anyone can view boxes" on public.boxes
  for select using (true);

create policy "Anyone can insert boxes" on public.boxes
  for insert with check (true);

create policy "Anyone can update boxes" on public.boxes
  for update using (true);

create policy "Anyone can delete boxes" on public.boxes
  for delete using (true);

create policy "Anyone can view box_contents" on public.box_contents
  for select using (true);

create policy "Anyone can insert box_contents" on public.box_contents
  for insert with check (true);

create policy "Anyone can update box_contents" on public.box_contents
  for update using (true);

create policy "Anyone can delete box_contents" on public.box_contents
  for delete using (true);

-- Insert default locations
insert into public.locations (name, description) values
  ('Garage', 'Main storage area for seasonal items and tools'),
  ('Storage Room', 'Climate-controlled room for electronics and appliances'),
  ('Bedroom Closet', 'Upper shelf storage for clothing and linens'),
  ('Basement', 'Long-term storage for books and archives'),
  ('Attic', 'Overhead storage space - check temperature sensitivity')
on conflict do nothing;

-- Create a function to get box with contents
create or replace function get_box_with_contents(box_qr_code text)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'id', b.id,
    'name', b.name,
    'description', b.description,
    'qr_code', b.qr_code,
    'image_url', b.image_url,
    'location_id', b.location_id,
    'ai_analysis', b.ai_analysis,
    'created_at', b.created_at,
    'updated_at', b.updated_at,
    'contents', coalesce(
      json_agg(bc.content) filter (where bc.content is not null),
      '[]'::json
    )
  )
  into result
  from public.boxes b
  left join public.box_contents bc on b.id = bc.box_id
  where b.qr_code = box_qr_code
  group by b.id, b.name, b.description, b.qr_code, b.image_url, b.location_id, b.ai_analysis, b.created_at, b.updated_at;
  
  return result;
end;
$$ language plpgsql; 