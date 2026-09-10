-- Match the app limit and leave room for multipart overhead on Vercel.
update storage.buckets set file_size_limit = 3145728 where id = 'payment-slips';
