<?php

namespace App\Support;

class FrontendOrigins
{
    /**
     * @return array<int, string>
     */
    public static function hosts(string $urls): array
    {
        $hosts = [];

        foreach (explode(',', $urls) as $url) {
            $url = trim($url);

            if ($url === '') {
                continue;
            }

            $host = parse_url($url, PHP_URL_HOST);

            if (! $host) {
                $host = parse_url('https://'.ltrim($url, '/'), PHP_URL_HOST);
            }

            if ($host) {
                $hosts[] = $host;
            }
        }

        return array_values(array_unique($hosts));
    }
}
