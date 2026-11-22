<?php

namespace Tests\Unit;

use App\Support\FrontendOrigins;
use PHPUnit\Framework\TestCase;

class FrontendOriginsTest extends TestCase
{
    public function test_memecah_beberapa_origin(): void
    {
        $this->assertSame(
            ['apps-fsm.undip.ac.id', '10.137.58.142'],
            FrontendOrigins::hosts('https://apps-fsm.undip.ac.id, http://10.137.58.142:20083'),
        );
    }

    public function test_menerima_url_tanpa_skema(): void
    {
        $this->assertSame(['apps-fsm.undip.ac.id'], FrontendOrigins::hosts('apps-fsm.undip.ac.id'));
    }

    public function test_mengabaikan_nilai_kosong(): void
    {
        $this->assertSame(['apps-fsm.undip.ac.id'], FrontendOrigins::hosts(', https://apps-fsm.undip.ac.id, '));
    }
}
