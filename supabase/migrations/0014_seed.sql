-- 0014_seed.sql
-- Seed from the existing hardcoded arrays. Idempotent-ish: guarded by NOT EXISTS
-- on a representative table so re-running won't duplicate. Apostrophes are
-- doubled ('' ) per SQL string escaping (Fajrussa''adah, Ar-Ruhamaa'').

-- penerima (penerima.astro merged with IndonesiaMap.tsx lat/lng/alamat)
insert into public.penerima (name, type, city, province, alamat, galon, lat, lng, sort_order)
select * from (values
  ('PP An-Nur','Pesantren','Karangmojo','Gunung Kidul','Ds Karangmojo, Kec. Karangmojo',6,-7.932,110.662,1),
  ('PP Fajrussa''adah','Pesantren','Wonosari','Gunung Kidul','Ds Kepek, Kec. Wonosari',8,-7.963,110.601,2),
  ('PP KI Ageng Wonokusumo','Pesantren','Karangmojo','Gunung Kidul','Ds Jatiayu, Kec. Karangmojo',6,-7.925,110.670,3),
  ('PP Al-Kholifah','Pesantren','Paliyan','Gunung Kidul','Ds Mulusan, Kec. Paliyan',5,-7.974,110.498,4),
  ('PP Al-Murtadlo','Pesantren','Ponjong','Gunung Kidul','Ds Genjahan, Kec. Ponjong',10,-7.928,110.722,5),
  ('PP Al-Hikmah Gubuk Rubuh','Pesantren','Playen','Gunung Kidul','Ds Getas, Kec. Playen',8,-7.958,110.548,6),
  ('PP Ar-Ruhamaa''','Pesantren','Playen','Gunung Kidul','Playen II, Kec. Playen',10,-7.952,110.540,7),
  ('Pondok Nurul Jamil Al-Jumar','Pesantren','Wonosari','Gunung Kidul','Ds Duwet, Kec. Wonosari',6,-7.955,110.608,8),
  ('PP Nurulhadi 2','Pesantren','Playen','Gunung Kidul','Dsn. Ngleri Wetan, Kec. Playen',2,-7.945,110.535,9),
  ('PP Ash-Shiddiq 2','Pesantren','Ngawen','Gunung Kidul','Ds Jurangjero, Kec. Ngawen',8,-7.892,110.630,10),
  ('PP Hidayatul Mubtadiin Kunci','Pesantren','Panggang','Gunung Kidul','Mendak, Girisekar, Kec. Panggang',5,-8.018,110.432,11),
  ('PP & Islamic Center Yasma Mulia','Pesantren','Wonosari','Gunung Kidul','Baleharjo, Kec. Wonosari',4,-7.970,110.595,12),
  ('PP Roudlotuth Tholabah','Pesantren','Paliyan','Gunung Kidul','Ds Karangasem, Kec. Paliyan',2,-7.980,110.505,13),
  ('PP Kun Solihan','Pesantren','Playen','Gunung Kidul','Ds Glidag, Kec. Playen',6,-7.960,110.555,14),
  ('Yayasan Panti Asuhan Islam','Yayasan','Playen','Gunung Kidul','Tumpak, Ngawu, Playen',14,-7.950,110.543,15),
  ('PP Thoriqul Mukminin','Pesantren','Semanu','Gunung Kidul','Ds Semanu, Kec. Semanu',20,-7.985,110.670,16),
  ('PP Baitul Jannah Darussalam','Pesantren','Wonosari','Gunung Kidul','Butuh, Pulutan, Wonosari',6,-7.958,110.612,17),
  ('PP Assalafiyah Darussalam','Pesantren','Wonosari','Gunung Kidul','Ds Siraman, Kec. Wonosari',5,-7.950,110.590,18),
  ('PP Muhammadiyah Al-Mujahidin','Pesantren','Playen','Gunung Kidul','Ds Bandung, Kec. Playen',10,-7.965,110.525,19)
) as v(name,type,city,province,alamat,galon,lat,lng,sort_order)
where not exists (select 1 from public.penerima);

-- stats: home group (StatStrip.astro)
insert into public.stats (grp, num, suffix, label, sort_order)
select * from (values
  ('home',7,'','Kecamatan Terjangkau',1),
  ('home',19,'','Lembaga Penerima',2),
  ('home',298,'','Galon/Distribusi',3),
  ('home',1,'','Kabupaten Aktif',4)
) as v(grp,num,suffix,label,sort_order)
where not exists (select 1 from public.stats where grp = 'home');

-- stats: penerima group (penerima.astro)
insert into public.stats (grp, num, suffix, label, sort_order)
select * from (values
  ('penerima',1,'','Kabupaten',1),
  ('penerima',19,'','Lembaga Penerima',2),
  ('penerima',298,'','Galon/Distribusi',3),
  ('penerima',7,'','Kecamatan',4)
) as v(grp,num,suffix,label,sort_order)
where not exists (select 1 from public.stats where grp = 'penerima');

-- features (Features.astro)
insert into public.features (n, title, descr, sort_order)
select * from (values
  ('01','Air Minum Berkualitas','Air RO bersih, layak konsumsi, melalui sistem filtrasi multi-stage. Diuji berkala untuk memastikan setiap tetes aman bagi penerima manfaat.',1),
  ('02','Armada Berjalan','Mobil karoseri custom dengan tangki stainless steel, mesin filtrasi onboard, dan 4 keran pengisian. Air bisa diambil langsung di lokasi.',2),
  ('03','Jangkauan Luas','Menjangkau masjid, pesantren, dan sekolah di pelosok yang sulit dijangkau distribusi air komersial. Dari Jawa hingga Indonesia timur.',3),
  ('04','Transparan & Tercatat','Setiap distribusi air minum dilakukan secara transparan dan terdokumentasi. Donatur dapat memantau realisasi penyaluran melalui laporan update distribusi yang kami sediakan.',4)
) as v(n,title,descr,sort_order)
where not exists (select 1 from public.features);

-- program_slides (Features.astro)
insert into public.program_slides (src, cap, meta, sort_order)
select * from (values
  ('/assets/program/trqf9zfd6hz97ngvn5jd.webp','Penyaluran galon air bersih langsung di lokasi penerima manfaat.','Distribusi · Masjid',1),
  ('/assets/program/arbqx8w3ey4ojtazvkb5.webp','Galon Gerakan Wakaf Sumur siap disalurkan ke pesantren.','Persiapan · Galon air',2),
  ('/assets/program/b3uh9laknqa7nekbljne.webp','Koordinasi tim relawan di lapangan sebelum distribusi.','Tim relawan',3),
  ('/assets/program/bu2p28ll3mlw8ogacirr.webp','Air bersih sampai ke lembaga pendidikan Islam.','Penyaluran · Sekolah',4),
  ('/assets/program/jby1yhbs5gzsuyn1edx0.webp','Dokumentasi penyerahan bantuan air minum.','Serah terima',5),
  ('/assets/program/zmihg9bm37tjuj4dg5nr.webp','Relawan bersama penerima manfaat di lokasi.','Silaturahmi',6)
) as v(src,cap,meta,sort_order)
where not exists (select 1 from public.program_slides);

-- gallery (Gallery.astro)
insert into public.gallery (bg, title, meta, sort_order)
select * from (values
  ('/assets/galeri/serah-terima.webp','Penandatanganan Surat Serah Terima','Distribusi Air Minum',1),
  ('/assets/galeri/pengisian-galon.webp','Pembersihan dan Pengisian Galon','Proses persiapan distribusi',2),
  ('/assets/galeri/penyerahan-bantuan.webp','Penyerahan Bantuan Air Minum','Distribusi ke penerima manfaat',3),
  ('/assets/galeri/foto-bersama.webp','Foto Bersama Penerima Manfaat','Dokumentasi penerima air minum',4)
) as v(bg,title,meta,sort_order)
where not exists (select 1 from public.gallery);

-- hero_slides (Hero.astro)
insert into public.hero_slides (src, cap, sort_order)
select * from (values
  ('/assets/hero/DSC00481_5_11zon.webp','Armada Sedekah Air Minum — siap melayani umat di pelosok negeri',1),
  ('/assets/hero/DSC00529_4_11zon.webp','Body karoseri dengan branding Gerakan Wakaf Sumur',2),
  ('/assets/hero/DSC00489_7_11zon.webp','Empat keran dispenser stainless steel siap mengalirkan air bersih',3),
  ('/assets/hero/DSC00549_3_11zon.webp','Armada keliling menjangkau pelosok — sedekahairminum.com',4),
  ('/assets/hero/DSC00554_2_11zon.webp','Setiap tetesan tercatat & tersalurkan dengan transparan',5),
  ('/assets/hero/DSC00570_1_11zon.webp','Setiap tegukan, ada pahala yang terus mengalir',6),
  ('/assets/hero/DSC00484_6_11zon.webp','Sistem filtrasi RO terbuka — air bersih langsung dari armada',7)
) as v(src,cap,sort_order)
where not exists (select 1 from public.hero_slides);

-- testimonials (Testimonials.astro)
insert into public.testimonials (body, name, role, photo, sort_order)
select * from (values
  ('Distribusi air minum ini sangat bermanfaat bagi pondok kami, khususnya karena wilayah Gunungkidul memiliki air berkapur cukup tinggi. Bantuan ini membantu kebutuhan air minum santri agar tetap sehat dan semangat beraktivitas. Terima kasih atas kepedulian dan bantuannya.','Yayasan Panti Asuhan Islam','Gunungkidul','/assets/testimoni/testi-1.webp',1),
  ('Alhamdulillah, bantuan air minum ini sangat bermanfaat bagi pondok kami. Kami bersyukur karena kebutuhan air minum santri sangat terbantu, terlebih pengadaan galon sebelumnya sering terkendala keterlambatan pengiriman.','Pondok Pesantren Ainul Yakin Special Childreen','','/assets/testimoni/testi-2.webp',2),
  ('Alhamdulillah, bantuan distribusi air minum ini membawa manfaat besar bagi pondok kami. Kebutuhan air bersih santri menjadi lebih tercukupi dan sangat membantu aktivitas sehari-hari di pondok. Kami mengucapkan terima kasih atas perhatian dan kepeduliannya.','Nurul Qur''an Islamic Boarding School','','/assets/testimoni/testi-3.webp',3)
) as v(body,name,role,photo,sort_order)
where not exists (select 1 from public.testimonials);

-- faqs (FAQ.astro)
insert into public.faqs (q, a, sort_order)
select * from (values
  ('Apa itu Sedekah Air Minum?','Sedekah air minum adalah gerakan sedekah yang menyalurkan air minum gratis untuk pondok pesantren dan lembaga yang membutuhkan, terutama di daerah yang sulit terjangkau distribusi air komersial.',1),
  ('Bagaimana cara berdonasi atau bersedekah?','Donatur cukup mengisi formulir donasi di website atau menghubungi nomor WhatsApp kami. Donasi mulai Rp 5.000 sudah bisa mengalirkan air bersih ke penerima manfaat. Setiap donatur akan menerima konfirmasi dan laporan update distribusi.',2),
  ('Berapa lama proses penyaluran air ke penerima manfaat?','Setelah pengajuan terkonfirmasi, permohonan akan diproses mulai dari filterisasi data, survei, hingga distribusi. Bantuan air minum dapat diterima maksimal 14 hari kerja dan seluruh proses akan kami update melalui WhatsApp.',3),
  ('Apakah saya akan mendapatkan bukti penyaluran?','Tentu, setiap donatur akan menerima info terbaru penyaluran air minum gratis via WhatsApp.',4),
  ('Apakah ada minimal jumlah untuk sedekah?','Tidak ada minimum. Donasi dimulai dari Rp 5.000 — cukup untuk mengalirkan satu galon air bersih. Anda bebas berdonasi sesuai kemampuan; setiap tetes bernilai pahala.',5)
) as v(q,a,sort_order)
where not exists (select 1 from public.faqs);

-- values_list (tentang.astro)
insert into public.values_list (n, title, descr, sort_order)
select * from (values
  ('01','Amanah','Setiap rupiah donasi tercatat, terlapor, dan tersalurkan dengan dokumentasi yang dapat diverifikasi.',1),
  ('02','Transparan','Sistem tracking real-time, laporan triwulan terbuka, dan keuangan diaudit setiap tahun.',2),
  ('03','Profesional','Standar kualitas air, sistem operasi armada, dan layanan donatur dikelola dengan disiplin tinggi.',3),
  ('04','Berkah','Kami percaya setiap tegukan air yang sampai pada hamba Allah adalah jariyah yang terus mengalir.',4)
) as v(n,title,descr,sort_order)
where not exists (select 1 from public.values_list);

-- team (tentang.astro)
insert into public.team (role, avatar, sort_order)
select * from (values
  ('Founder & Direktur','https://api.dicebear.com/9.x/notionists/svg?seed=founder&backgroundColor=b6e3f4',1),
  ('Operasional Armada','https://api.dicebear.com/9.x/notionists/svg?seed=operasional&backgroundColor=c0aede',2),
  ('Donor Relations','https://api.dicebear.com/9.x/notionists/svg?seed=donor&backgroundColor=d1d4f9',3)
) as v(role,avatar,sort_order)
where not exists (select 1 from public.team);

-- misi (tentang.astro)
insert into public.misi (body, sort_order)
select * from (values
  ('Menyalurkan air minum layak konsumsi ke 1.000+ lembaga penerima manfaat per tahun.',1),
  ('Membangun sistem distribusi yang transparan, terdokumentasi, dan dapat diverifikasi setiap donatur.',2),
  ('Mengedukasi masyarakat tentang keutamaan sedekah air minum sebagai sedekah jariyah.',3),
  ('Mengembangkan armada dan tim agar menjangkau seluruh pelosok Indonesia.',4)
) as v(body,sort_order)
where not exists (select 1 from public.misi);

-- rekening (kontak.astro)
insert into public.rekening (bank, no, label, sort_order)
select * from (values
  ('Bank Mandiri','1360020240013','MANDIRI',1),
  ('Bank Syariah Indonesia (BSI)','7263493618','BSI',2),
  ('Bank BCA','7831221333','BCA',3)
) as v(bank,no,label,sort_order)
where not exists (select 1 from public.rekening);

-- settings: contact + social (kontak.astro / Footer.astro)
insert into public.settings (key, value) values
  ('contact', jsonb_build_object(
    'whatsapp','6285319480974',
    'email','gerakansumur@gmail.com',
    'address','Karang Duwet II, Karangrejek, Kec. Wonosari, Kab. Gunung Kidul, DI Yogyakarta',
    'hours','Senin–Sabtu · 08:00–17:00 WIB')),
  ('social', jsonb_build_object(
    'instagram','','facebook','','youtube','','tiktok','','whatsapp','6285319480974')),
  ('feature_toggles', jsonb_build_object(
    'blog_enabled', true, 'show_map', true))
on conflict (key) do nothing;
